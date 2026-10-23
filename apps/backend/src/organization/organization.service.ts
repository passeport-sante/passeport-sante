import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { PrismaService } from "@/prisma/prisma.service";
import { departmentFromPostalCode } from "../common/department";

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  async create(createOrganizationDto: CreateOrganizationDto) {
    await this.assertUaiFree(createOrganizationDto.uai);
    return this.prisma.organization.create({
      data: this.withDepartment(createOrganizationDto),
    });
  }

  // Un même collège (même numéro UAI) ne peut exister qu'une fois.
  private async assertUaiFree(uai: string | null | undefined, exceptId?: string) {
    if (!uai) return;
    const existing = await this.prisma.organization.findUnique({ where: { uai }, select: { id: true, name: true } });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException(`Cet établissement existe déjà : « ${existing.name} ».`);
    }
  }

  // Le département n'est jamais saisi : il suit toujours le code postal.
  private withDepartment<T extends { postalCode?: string; city?: string }>(dto: T) {
    if (dto.postalCode === undefined) return dto;
    const postalCode = dto.postalCode.trim();
    return {
      ...dto,
      ...(dto.city !== undefined ? { city: dto.city.trim() } : {}),
      postalCode,
      department: departmentFromPostalCode(postalCode),
    };
  }

  // Avec le nombre de comptes, sessions et modules : la page de gestion montre ainsi
  // quels établissements sont vides (seuls ceux-là peuvent être supprimés).
  findAll() {
    return this.prisma.organization.findMany({
      include: { _count: { select: { users: true, diagnosticSessions: true, moduleSessions: true, modules: true } } },
      orderBy: { name: "asc" },
    });
  }

  findOne(id: string) {
    return this.prisma.organization.findUnique({ where: { id } });
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    await this.assertUaiFree(updateOrganizationDto.uai, id);
    return this.prisma.organization.update({
      where: { id },
      data: this.withDepartment(updateOrganizationDto),
    });
  }

  // Suppression bloquée si l'établissement contient encore des données, pour éviter
  // toute perte accidentelle. L'admin doit d'abord supprimer comptes/sessions/modules.
  async remove(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, modules: true, moduleSessions: true, diagnosticSessions: true } },
      },
    });
    if (!org) throw new NotFoundException("Établissement introuvable");

    const c = org._count;
    const blockers: string[] = [];
    if (c.users) blockers.push(`${c.users} compte(s)`);
    if (c.diagnosticSessions) blockers.push(`${c.diagnosticSessions} session(s) diagnostic`);
    if (c.moduleSessions) blockers.push(`${c.moduleSessions} session(s) module`);
    if (c.modules) blockers.push(`${c.modules} module(s)`);

    if (blockers.length) {
      throw new ConflictException(
        `Impossible de supprimer : cet établissement contient encore ${blockers.join(", ")}. Supprimez-les d'abord.`,
      );
    }

    return this.prisma.organization.delete({ where: { id } });
  }
}
