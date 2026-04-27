import { Injectable } from '@nestjs/common';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { PrismaService } from '@/prisma/prisma.service';

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
    return this.prisma.module.findMany({ select: MODULE_PUBLIC_FIELDS });
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
    return this.prisma.module.findUnique({ where: { id } });
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

  remove(id: string) {
    return this.prisma.module.delete({ where: { id } });
  }
}
