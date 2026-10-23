import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CreateStepDto } from "./dto/create-step.dto";
import { UpdateStepDto } from "./dto/update-step.dto";
import { GameDataInputDto } from "./dto/game-data.dto";
import { ReorderStepsDto } from "./dto/reorder-steps.dto";
import { PrismaService } from "@/prisma/prisma.service";
import { ModuleVersionsService } from "../module-versions/module-versions.service";

function jsonOrDbNull(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (value === null || value === undefined) return Prisma.DbNull;
  return value as Prisma.InputJsonValue;
}

function gameDataCreatePayload(items: GameDataInputDto[]) {
  return items.map((gd) => ({
    questionData: gd.questionData as Prisma.InputJsonValue,
    correctAnswer: jsonOrDbNull(gd.correctAnswer),
    hints: jsonOrDbNull(gd.hints),
  }));
}

@Injectable()
export class StepService {
  constructor(
    private prisma: PrismaService,
    private moduleVersions: ModuleVersionsService,
  ) {}

  async create(dto: CreateStepDto, userId?: string) {
    await this.moduleVersions.snapshotModule(dto.moduleId, userId);
    const { gameData, content, ...rest } = dto;
    return this.prisma.step.create({
      data: {
        ...rest,
        content: content ? (content as Prisma.InputJsonValue) : undefined,
        gameData: gameData?.length
          ? { create: gameDataCreatePayload(gameData) }
          : undefined,
      },
      include: { gameData: true },
    });
  }

  findAll() {
    return this.prisma.step.findMany();
  }

  findOne(id: string) {
    return this.prisma.step.findUnique({
      where: { id },
      include: {
        gameData: true,
        module: {
          select: {
            id: true,
            slug: true,
            title: true,
            mascotte: true,
            colorPrimary: true,
            colorSecondary: true,
            steps: { select: { id: true, order: true, kind: true, gameType: true }, orderBy: { order: "asc" } },
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateStepDto, userId?: string) {
    const { gameData, content, ...rest } = dto;
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.step.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException("Étape introuvable");

      await this.moduleVersions.snapshotModule(existing.moduleId, userId, tx);

      // Si gameData est fourni, on remplace tout
      if (gameData) {
        await tx.gameData.deleteMany({ where: { stepId: id } });
        if (gameData.length > 0) {
          await tx.gameData.createMany({
            data: gameDataCreatePayload(gameData).map((d) => ({ ...d, stepId: id })),
          });
        }
      }

      return tx.step.update({
        where: { id },
        data: {
          ...rest,
          content:
            content === undefined
              ? undefined
              : content === null
                ? Prisma.DbNull
                : (content as Prisma.InputJsonValue),
        },
        include: { gameData: true },
      });
    });
  }

  async reorder(dto: ReorderStepsDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.moduleVersions.snapshotModule(dto.moduleId, userId, tx);
      return Promise.all(
        dto.items.map((item) =>
          tx.step.update({
            where: { id: item.id },
            data: { order: item.order },
          }),
        ),
      );
    });
  }

  async remove(id: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.step.findUnique({ where: { id }, select: { moduleId: true } });
      if (!existing) throw new NotFoundException("Étape introuvable");

      await this.moduleVersions.snapshotModule(existing.moduleId, userId, tx);

      await tx.gameData.deleteMany({ where: { stepId: id } });
      return tx.step.delete({ where: { id } });
    });
  }
}
