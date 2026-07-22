import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateMascotteDto } from "./dto/create-mascotte.dto";
import { UpdateMascotteDto } from "./dto/update-mascotte.dto";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class MascotteService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.mascotte.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
  }

  async create(dto: CreateMascotteDto) {
    const existing = await this.prisma.mascotte.findUnique({
      where: { url: dto.url },
    });
    if (existing) {
      throw new ConflictException("Cette mascotte est déjà dans le catalogue");
    }
    return this.prisma.mascotte.create({ data: dto });
  }

  async update(id: string, dto: UpdateMascotteDto) {
    await this.ensureExists(id);
    return this.prisma.mascotte.update({ where: { id }, data: dto });
  }

  /**
   * Supprime l'entrée du catalogue uniquement. Les modules référencent la
   * mascotte par son URL et non par une clé étrangère : ceux qui l'utilisent
   * déjà continuent donc de l'afficher, elle disparaît simplement des choix
   * proposés. Le fichier reste sur Cloudinary — le supprimer casserait ces
   * modules.
   */
  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.mascotte.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.mascotte.findUnique({ where: { id } });
    if (!found) throw new NotFoundException("Mascotte introuvable");
    return found;
  }
}
