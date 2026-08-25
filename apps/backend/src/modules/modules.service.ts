import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { ImportModuleDto } from './dto/import-module.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { ModuleVersionsService } from '../module-versions/module-versions.service';

// Helper : Json? Prisma → InputJsonValue | DbNull (skip undefined)
function jsonOrDbNull(value: Prisma.JsonValue | null | undefined): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (value === null || value === undefined) return Prisma.DbNull;
  return value as Prisma.InputJsonValue;
}

// Slug kebab-case sans accent, aligné sur le front.
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

// Champs publics d'un module renvoyés au frontend
const MODULE_PUBLIC_FIELDS = {
  id: true,
  title: true,
  description: true,
  slug: true,
  duration: true,
  mascotte: true,
  colorPrimary: true,
  colorSecondary: true,
  colorCard: true,
  colorCardSecondary: true,
} as const;

@Injectable()
export class ModulesService {
  constructor(
    private prisma: PrismaService,
    private moduleVersions: ModuleVersionsService,
  ) {}

  async create(dto: CreateModuleDto) {
    try {
      return await this.prisma.module.create({ data: dto });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('Un module avec ce slug existe déjà');
      throw e;
    }
  }

  findAll() {
    return this.prisma.module.findMany({
      where: { isActive: true },
      select: MODULE_PUBLIC_FIELDS,
    });
  }

  // Vue admin : tous les modules (actifs + inactifs), avec compteurs
  findAllAdmin() {
    return this.prisma.module.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        ...MODULE_PUBLIC_FIELDS,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { id: true, name: true, slug: true, color: true } },
        _count: { select: { steps: { where: { kind: 'GAME' } }, moduleSessions: true } },
      },
    });
  }

  // Retourne les catégories (triées par order) avec leurs modules actifs
  findAllGrouped() {
    return this.prisma.category.findMany({
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        modules: {
          where: { isActive: true },
          select: MODULE_PUBLIC_FIELDS,
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.module.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        // gameData inclus pour permettre l'export complet du contenu d'un module.
        steps: { orderBy: { order: 'asc' }, include: { gameData: true } },
      },
    });
  }

  findBySlug(slug: string) {
    return this.prisma.module.findUnique({
      where: { slug },
      include: {
        steps: { orderBy: { order: 'asc' }, select: { id: true, order: true, kind: true, gameType: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async update(id: string, dto: UpdateModuleDto, userId?: string) {
    await this.moduleVersions.snapshotModule(id, userId);
    return this.prisma.module.update({ where: { id }, data: dto });
  }

  // Duplique un module + tous ses steps + leurs gameData
  async duplicate(id: string) {
    const source = await this.prisma.module.findUnique({
      where: { id },
      include: { steps: { include: { gameData: true } } },
    });
    if (!source) throw new NotFoundException('Module introuvable');

    const baseSlug = `${source.slug}-copie`;
    const slug = await this.findAvailableSlug(baseSlug);

    return this.prisma.module.create({
      data: {
        title: `${source.title} (copie)`,
        description: source.description,
        slug,
        duration: source.duration,
        isActive: false,
        mascotte: source.mascotte,
        colorPrimary: source.colorPrimary,
        colorSecondary: source.colorSecondary,
        colorCard: source.colorCard,
        colorCardSecondary: source.colorCardSecondary,
        organizationId: source.organizationId,
        categoryId: source.categoryId,
        steps: {
          create: source.steps.map((step: (typeof source.steps)[number]) => ({
            kind: step.kind,
            gameType: step.gameType,
            order: step.order,
            mascotteImage: step.mascotteImage,
            content: jsonOrDbNull(step.content),
            gameData: {
              create: step.gameData.map((gd: (typeof step.gameData)[number]) => ({
                questionData: gd.questionData as Prisma.InputJsonValue,
                correctAnswer: jsonOrDbNull(gd.correctAnswer),
                hints: jsonOrDbNull(gd.hints),
              })),
            },
          })),
        },
      },
    });
  }

  // Supprime un module et son contenu (steps, gameData, responses, stats).
  // Les sessions fermées liées sont conservées — leur moduleId passe à null (onDelete: SetNull).
  // Bloque uniquement si des sessions actives existent.
  async remove(id: string) {
    const module = await this.prisma.module.findUnique({
      where: { id },
      select: { id: true, _count: { select: { moduleSessions: { where: { isActive: true } } } } },
    });
    if (!module) throw new NotFoundException('Module introuvable');

    if (module._count.moduleSessions > 0) {
      throw new ConflictException(
        'Ce module est référencé par des sessions actives. Clôturez-les avant de supprimer.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Les sessions existantes (fermées) sont préservées — moduleId devient null via onDelete: SetNull
      const steps = await tx.step.findMany({
        where: { moduleId: id },
        select: { id: true },
      });
      const stepIds = steps.map((s) => s.id);

      if (stepIds.length > 0) {
        await tx.gameData.deleteMany({ where: { stepId: { in: stepIds } } });
        await tx.kanbanResponse.deleteMany({ where: { stepId: { in: stepIds } } });
        await tx.quizResponse.deleteMany({ where: { stepId: { in: stepIds } } });
        await tx.puzzleResponse.deleteMany({ where: { stepId: { in: stepIds } } });
      }

      await tx.kanbanResponse.deleteMany({ where: { moduleId: id } });
      await tx.quizResponse.deleteMany({ where: { moduleId: id } });
      await tx.puzzleResponse.deleteMany({ where: { moduleId: id } });
      await tx.moduleProgress.deleteMany({ where: { moduleId: id } });
      await tx.statisticsData.deleteMany({ where: { moduleId: id } });
      await tx.step.deleteMany({ where: { moduleId: id } });

      return tx.module.delete({ where: { id } });
    });
  }

  private async findAvailableSlug(base: string): Promise<string> {
    let slug = base;
    let i = 2;
    while (await this.prisma.module.findUnique({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }
    return slug;
  }

  // Crée un module complet (étapes + gameData) à partir d'un JSON d'import.
  // L'ordre des étapes est déduit de leur position dans le tableau. La catégorie
  // est retrouvée par nom, ou créée à la volée si elle n'existe pas encore.
  async importModule(dto: ImportModuleDto) {
    const categoryId = await this.resolveCategoryByName(dto.category);
    const slug = await this.findAvailableSlug(slugify(dto.title) || 'module');

    return this.prisma.module.create({
      data: {
        title: dto.title.trim(),
        description: dto.description,
        slug,
        duration: dto.duration,
        isActive: dto.isActive ?? false,
        mascotte: dto.mascotte,
        colorPrimary: dto.colorPrimary,
        colorSecondary: dto.colorSecondary,
        colorCard: dto.colorCard,
        colorCardSecondary: dto.colorCardSecondary,
        organizationId: dto.organizationId,
        categoryId: categoryId ?? undefined,
        steps: {
          create: (dto.steps ?? []).map((s, i) => ({
            kind: s.kind ?? 'GAME',
            gameType: s.gameType ?? null,
            order: i,
            mascotteImage: s.mascotteImage,
            content: s.content ? (s.content as Prisma.InputJsonValue) : undefined,
            gameData: s.gameData?.length
              ? {
                  create: s.gameData.map((gd) => ({
                    questionData: gd.questionData as Prisma.InputJsonValue,
                    correctAnswer: jsonOrDbNull(gd.correctAnswer),
                    hints: jsonOrDbNull(gd.hints),
                  })),
                }
              : undefined,
          })),
        },
      },
    });
  }

  // Retrouve une catégorie par nom (ou slug), ou la crée si absente.
  private async resolveCategoryByName(name?: string): Promise<string | null> {
    if (!name?.trim()) return null;
    const slug = slugify(name);
    const existing = await this.prisma.category.findFirst({
      where: { OR: [{ slug }, { name: name.trim() }] },
    });
    if (existing) return existing.id;
    const order =
      ((await this.prisma.category.aggregate({ _max: { order: true } }))._max.order ?? -1) + 1;
    const created = await this.prisma.category.create({
      data: { name: name.trim(), slug, order },
    });
    return created.id;
  }
}
