import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  create(createOrganizationDto: CreateOrganizationDto) {
    return this.prisma.organization.create({
      data: createOrganizationDto,
    });
  }

  findAll() {
    return this.prisma.organization.findMany();
  }

  findOne(id: string) {
    return this.prisma.organization.findUnique({ where: { id } });
  }

  update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    return this.prisma.organization.update({
      where: { id },
      data: updateOrganizationDto,
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
