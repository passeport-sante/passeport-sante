import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { PrismaService } from "@/prisma/prisma.service";

// Slug kebab-case sans accent, aligné sur slugify() du front.
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  // Toutes les catégories, avec le nombre de modules rattachés (pour l'UI de gestion).
  findAll() {
    return this.prisma.category.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        order: true,
        _count: { select: { modules: true } },
      },
    });
  }

  async create(dto: CreateCategoryDto) {
    const slug = await this.findAvailableSlug(slugify(dto.name));
    if (!slug) throw new ConflictException("Nom de catégorie invalide");

    // À défaut d'ordre fourni, on place la nouvelle catégorie en fin de liste.
    const order =
      dto.order ??
      ((await this.prisma.category.aggregate({ _max: { order: true } }))._max.order ?? -1) + 1;

    return this.prisma.category.create({
      data: { name: dto.name.trim(), slug, color: dto.color, order },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.ensureExists(id);
    // On ne régénère le slug que si le nom change, pour ne pas casser des liens existants.
    const slug = dto.name ? await this.findAvailableSlug(slugify(dto.name), id) : undefined;
    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(slug ? { slug } : {}),
        ...(dto.color !== undefined ? { color: dto.color } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
      },
    });
  }

  /**
   * Supprime la catégorie. Les modules rattachés ne sont PAS supprimés : ils
   * passent simplement en « sans catégorie » (categoryId = null), pour ne jamais
   * perdre de contenu pédagogique à cause d'un rangement.
   */
  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.module.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
      await tx.category.delete({ where: { id } });
    });
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.category.findUnique({ where: { id } });
    if (!found) throw new NotFoundException("Catégorie introuvable");
    return found;
  }

  // Garantit l'unicité du slug en suffixant -2, -3… si besoin (hors catégorie `exceptId`).
  private async findAvailableSlug(base: string, exceptId?: string): Promise<string> {
    if (!base) return "";
    let slug = base;
    let i = 2;
    for (;;) {
      const existing = await this.prisma.category.findUnique({ where: { slug } });
      if (!existing || existing.id === exceptId) return slug;
      slug = `${base}-${i++}`;
    }
  }
}
