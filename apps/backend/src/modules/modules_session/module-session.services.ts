import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@/prisma/prisma.service";
import { AuthUser } from "../../auth/decorators/current-user.decorator";
import { CreateModuleSessionDto } from "./dto/create-module.dto";
import { UpdateModuleSessionDto } from "./dto/update-module.dto";
import { schoolYearOf } from "../../common/school-year";
import { resolveSessionOrganization } from "../../common/session-organization";
import { normalizeClassName } from "../../common/class-name";

@Injectable()
export class ModuleSessionService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // Portée d'accès : un ADMIN voit/gère toutes les sessions (super-admin),
  // un TRAINER est limité à son propre établissement.
  private scope(user: AuthUser) {
    return user.role === "ADMIN" ? {} : { organizationId: user.organizationId };
  }

  // createdByUserId provient toujours du token. organizationId aussi pour un TRAINER
  // (le body est ignoré : il ne peut pas rattacher une session à un autre établissement).
  // Un ADMIN n'appartient à aucun établissement scolaire : il doit choisir celui de la
  // session, sinon elle serait rattachée à sa propre organisation et perdue pour l'établissement.
  async create(dto: CreateModuleSessionDto, user: AuthUser) {
    const organizationId = await resolveSessionOrganization(this.prisma, dto.organizationId, user);
    const createdByUserId = user.userId;
    const accessCode = this.generateCode();
    const baseUrl = this.config.get<string>("FRONTEND_URL") ?? "http://localhost:3000";
    const accessUrl = `${baseUrl}/session/${accessCode}`;

    return this.prisma.moduleSession.create({
      data: {
        ...dto,
        className: normalizeClassName(dto.className, dto.level),
        organizationId,
        createdByUserId,
        accessCode,
        accessUrl,
        schoolYear: schoolYearOf(),
      },
    });
  }

  findAll(user: AuthUser) {
    return this.prisma.moduleSession.findMany({
      where: this.scope(user),
      include: {
        _count: { select: { guestStudents: true } },
        module: { select: { id: true, title: true, colorPrimary: true } },
        // Affiché aux comptes qui voient plusieurs établissements (admin).
        organization: { select: { id: true, name: true, city: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  findOne(id: string, user: AuthUser) {
    return this.prisma.moduleSession.findFirst({
      where: { id, ...this.scope(user) },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            slug: true,
            colorPrimary: true,
            steps: {
              select: { id: true, order: true, kind: true, gameType: true, content: true },
              orderBy: { order: "asc" },
            },
          },
        },
        _count: { select: { guestStudents: true } },
        guestStudents: {
          select: {
            id: true,
            kanbanResponses: { select: { stepId: true, isCorrect: true } },
            quizResponses:   { select: { stepId: true, isCorrect: true } },
            puzzleResponses: { select: { stepId: true, isCorrect: true } },
          },
        },
      },
    });
  }

  findByCode(code: string) {
    return this.prisma.moduleSession.findFirst({
      where: { accessCode: code },
      include: {
        module: { select: { id: true, title: true, slug: true, colorPrimary: true } },
      },
    });
  }

  async update(id: string, user: AuthUser, dto: UpdateModuleSessionDto) {
    // organizationId/createdByUserId ne sont jamais modifiables via l'update, même si présents dans le body
    const { organizationId: _orgId, createdByUserId: _ownerId, ...data } = dto;
    const { count } = await this.prisma.moduleSession.updateMany({
      where: { id, ...this.scope(user) },
      data,
    });
    if (count === 0) throw new NotFoundException("Session introuvable");
    return this.prisma.moduleSession.findUnique({ where: { id } });
  }

  // Suppression définitive : on retire d'abord les réponses, progressions et élèves
  // invités liés (pas de cascade en base), le tout dans une transaction.
  async remove(id: string, user: AuthUser) {
    const found = await this.prisma.moduleSession.findFirst({
      where: { id, ...this.scope(user) },
      select: { id: true },
    });
    if (!found) throw new NotFoundException("Session introuvable");

    await this.prisma.$transaction(async (tx) => {
      const guests = await tx.guestStudent.findMany({
        where: { sessionId: id },
        select: { id: true },
      });
      const guestIds = guests.map((g) => g.id);

      if (guestIds.length) {
        const where = { guestStudentId: { in: guestIds } };
        await tx.kanbanResponse.deleteMany({ where });
        await tx.quizResponse.deleteMany({ where });
        await tx.puzzleResponse.deleteMany({ where });
        await tx.moduleProgress.deleteMany({ where });
        await tx.guestStudent.deleteMany({ where: { id: { in: guestIds } } });
      }
      await tx.moduleSession.delete({ where: { id } });
    });
  }

  private generateCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }
}
