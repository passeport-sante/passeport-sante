import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { GameType, Prisma, StepKind } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";

const MAX_VERSIONS_PER_MODULE = 10;
// En dessous de ce délai, la dernière version couvre déjà "l'état avant les
// modifications en cours" — inutile d'en recréer une quasi identique (évite
// l'avalanche de snapshots lors d'éditions rapprochées, ex. réordonner des steps).
const SNAPSHOT_THROTTLE_MS = 30_000;

type Tx = Prisma.TransactionClient | PrismaService;

interface ModuleSnapshot {
  module: {
    title: string;
    description: string | null;
    duration: number | null;
    mascotte: string | null;
    colorPrimary: string | null;
    colorSecondary: string | null;
    colorCard: string | null;
    colorCardSecondary: string | null;
    categoryId: string | null;
  };
  steps: Array<{
    kind: StepKind;
    gameType: GameType | null;
    order: number;
    mascotteImage: string | null;
    content: Prisma.JsonValue;
    gameData: Array<{
      questionData: Prisma.JsonValue;
      correctAnswer: Prisma.JsonValue;
      hints: Prisma.JsonValue;
    }>;
  }>;
}

function jsonOrDbNull(
  value: Prisma.JsonValue | null | undefined,
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (value === null || value === undefined) return Prisma.DbNull;
  return value as Prisma.InputJsonValue;
}

function isModuleSnapshot(value: unknown): value is ModuleSnapshot {
  return (
    !!value &&
    typeof value === "object" &&
    Array.isArray((value as ModuleSnapshot).steps) &&
    typeof (value as ModuleSnapshot).module === "object"
  );
}

@Injectable()
export class ModuleVersionsService {
  constructor(private prisma: PrismaService) {}

  async snapshotModule(moduleId: string, userId?: string, tx: Tx = this.prisma): Promise<void> {
    const last = await tx.moduleVersion.findFirst({
      where: { moduleId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (last && Date.now() - last.createdAt.getTime() < SNAPSHOT_THROTTLE_MS) return;

    const module = await tx.module.findUnique({
      where: { id: moduleId },
      include: { steps: { orderBy: { order: "asc" }, include: { gameData: true } } },
    });
    if (!module) return;

    const snapshot: ModuleSnapshot = {
      module: {
        title: module.title,
        description: module.description,
        duration: module.duration,
        mascotte: module.mascotte,
        colorPrimary: module.colorPrimary,
        colorSecondary: module.colorSecondary,
        colorCard: module.colorCard,
        colorCardSecondary: module.colorCardSecondary,
        categoryId: module.categoryId,
      },
      steps: module.steps.map((step) => ({
        kind: step.kind,
        gameType: step.gameType,
        order: step.order,
        mascotteImage: step.mascotteImage,
        content: step.content,
        gameData: step.gameData.map((gd) => ({
          questionData: gd.questionData,
          correctAnswer: gd.correctAnswer,
          hints: gd.hints,
        })),
      })),
    };

    await tx.moduleVersion.create({
      data: {
        moduleId,
        snapshot: snapshot as unknown as Prisma.InputJsonValue,
        createdByUserId: userId,
      },
    });

    const excess = await tx.moduleVersion.findMany({
      where: { moduleId },
      orderBy: { createdAt: "desc" },
      skip: MAX_VERSIONS_PER_MODULE,
      select: { id: true },
    });
    if (excess.length > 0) {
      await tx.moduleVersion.deleteMany({ where: { id: { in: excess.map((v) => v.id) } } });
    }
  }

  async listVersions(moduleId: string, opts: { take?: number; cursor?: string }) {
    const take = opts.take ?? 20;
    const rows = await this.prisma.moduleVersion.findMany({
      where: { moduleId },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      skip: opts.cursor ? 1 : 0,
      cursor: opts.cursor ? { id: opts.cursor } : undefined,
      select: {
        id: true,
        createdAt: true,
        createdByUser: { select: { id: true, name: true, email: true } },
      },
    });

    const hasMore = rows.length > take;
    const items = hasMore ? rows.slice(0, take) : rows;
    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  async restoreVersion(moduleId: string, versionId: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const version = await tx.moduleVersion.findUnique({ where: { id: versionId } });
      if (!version || version.moduleId !== moduleId) {
        throw new NotFoundException("Version introuvable pour ce module");
      }

      const current = await tx.module.findUnique({
        where: { id: moduleId },
        select: { slug: true, organizationId: true, isActive: true },
      });
      if (!current) throw new NotFoundException("Module introuvable");

      const snapshot = version.snapshot as unknown;
      if (!isModuleSnapshot(snapshot)) {
        throw new BadRequestException("Version corrompue, restauration impossible");
      }

      // Point de restauration de l'état actuel avant de l'écraser — un restore
      // malencontreux reste lui-même annulable comme n'importe quelle version.
      await this.snapshotModule(moduleId, userId, tx);

      const stepIds = (await tx.step.findMany({ where: { moduleId }, select: { id: true } })).map(
        (s) => s.id,
      );
      if (stepIds.length > 0) {
        await tx.gameData.deleteMany({ where: { stepId: { in: stepIds } } });
        await tx.kanbanResponse.deleteMany({ where: { stepId: { in: stepIds } } });
        await tx.quizResponse.deleteMany({ where: { stepId: { in: stepIds } } });
        await tx.puzzleResponse.deleteMany({ where: { stepId: { in: stepIds } } });
      }
      await tx.step.deleteMany({ where: { moduleId } });

      await tx.module.update({
        where: { id: moduleId },
        data: {
          title: snapshot.module.title,
          description: snapshot.module.description,
          duration: snapshot.module.duration,
          mascotte: snapshot.module.mascotte,
          colorPrimary: snapshot.module.colorPrimary,
          colorSecondary: snapshot.module.colorSecondary,
          colorCard: snapshot.module.colorCard,
          colorCardSecondary: snapshot.module.colorCardSecondary,
          categoryId: snapshot.module.categoryId,
          // slug / organizationId / isActive volontairement préservés (pas restaurés)
          steps: {
            create: snapshot.steps.map((step) => ({
              kind: step.kind,
              gameType: step.gameType,
              order: step.order,
              mascotteImage: step.mascotteImage,
              content: jsonOrDbNull(step.content),
              gameData: {
                create: step.gameData.map((gd) => ({
                  questionData: gd.questionData as Prisma.InputJsonValue,
                  correctAnswer: jsonOrDbNull(gd.correctAnswer),
                  hints: jsonOrDbNull(gd.hints),
                })),
              },
            })),
          },
        },
      });

      return tx.module.findUnique({
        where: { id: moduleId },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          steps: { orderBy: { order: "asc" }, include: { gameData: true } },
        },
      });
    });
  }
}
