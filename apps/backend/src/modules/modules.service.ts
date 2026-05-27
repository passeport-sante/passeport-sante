import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { PrismaService } from '@/prisma/prisma.service';

// Helper : Json? Prisma → InputJsonValue | DbNull (skip undefined)
function jsonOrDbNull(value: Prisma.JsonValue | null | undefined): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (value === null || value === undefined) return Prisma.DbNull;
  return value as Prisma.InputJsonValue;
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
  constructor(private prisma: PrismaService) {}

  create(dto: CreateModuleDto) {
    return this.prisma.module.create({ data: dto });
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
        _count: { select: { steps: true, moduleSessions: true } },
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
        steps: { orderBy: { order: 'asc' } },
      },
    });
  }

  findBySlug(slug: string) {
    return this.prisma.module.findUnique({
      where: { slug },
      include: {
        steps: { orderBy: { order: 'asc' }, select: { id: true, order: true, gameType: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  update(id: string, dto: UpdateModuleDto) {
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

  remove(id: string) {
    return this.prisma.module.delete({ where: { id } });
  }

  private async findAvailableSlug(base: string): Promise<string> {
    let slug = base;
    let i = 2;
    while (await this.prisma.module.findUnique({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }
    return slug;
  }
}
