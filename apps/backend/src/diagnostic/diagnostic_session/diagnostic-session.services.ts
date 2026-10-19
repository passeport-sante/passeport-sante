import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@/prisma/prisma.service";
import { AuthUser } from "../../auth/decorators/current-user.decorator";
import { CreateDiagnosticSessionDto } from "./dto/create-diagnostic.dto";
import { UpdateDiagnosticSessionDto } from "./dto/update-diagnostic.dto";

@Injectable()
export class DiagnosticSessionService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // Portée d'accès : un ADMIN voit/gère toutes les sessions (super-admin),
  // un TRAINER est limité à son propre établissement.
  private scope(user: AuthUser) {
    return user.role === "ADMIN" ? {} : { organizationId: user.organizationId };
  }

  // organizationId/createdByUserId proviennent du token de l'utilisateur authentifié,
  // jamais du body envoyé par le client (sinon une session pourrait être rattachée à un autre établissement).
  async create(dto: CreateDiagnosticSessionDto, organizationId: string, createdByUserId: string) {
    const accessCode = this.generateCode();
    const baseUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const accessUrl = `${baseUrl}/diagnostic/${accessCode}`;

    return this.prisma.diagnosticSession.create({
      data: { ...dto, organizationId, createdByUserId, accessCode, accessUrl },
    });
  }

  // Les élèves exclus par l'enseignant ne comptent ni dans les effectifs ni dans
  // les réponses ; `completedCount` distingue ceux qui sont allés au bout.
  private readonly counts = {
    _count: {
      select: {
        guestStudents: { where: { excludedAt: null } },
        diagnosticResponses: { where: { guestStudent: { excludedAt: null } } },
      },
    },
  } as const;

  private async completedCounts(sessionIds: string[]) {
    const rows = await this.prisma.guestStudent.groupBy({
      by: ['diagnosticSessionId'],
      where: { diagnosticSessionId: { in: sessionIds }, excludedAt: null, completedAt: { not: null } },
      _count: { _all: true },
    });
    return new Map(rows.map((r) => [r.diagnosticSessionId, r._count._all]));
  }

  async findAll(user: AuthUser) {
    const sessions = await this.prisma.diagnosticSession.findMany({
      where: this.scope(user),
      include: {
        ...this.counts,
        createdByUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const completed = await this.completedCounts(sessions.map((s) => s.id));
    return sessions.map((s) => ({ ...s, completedCount: completed.get(s.id) ?? 0 }));
  }

  async findOne(id: string, user: AuthUser) {
    const session = await this.prisma.diagnosticSession.findFirst({
      where: { id, ...this.scope(user) },
      include: {
        createdByUser: { select: { id: true, name: true, email: true } },
        ...this.counts,
        guestStudents: {
          select: {
            id: true,
            createdAt: true,
            completedAt: true,
            excludedAt: true,
            _count: { select: { diagnosticResponses: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        diagnosticResponses: {
          where: { guestStudent: { excludedAt: null } },
          select: {
            id: true,
            isCorrect: true,
            userAnswer: true,
            questionId: true,
            guestStudentId: true,
            question: {
              select: {
                id: true,
                questionText: true,
                questionType: true,
                order: true,
                options: true,
                correctAnswer: true,
              },
            },
          },
        },
      },
    });
    if (!session) return null;
    const completedCount = session.guestStudents.filter((g) => g.completedAt && !g.excludedAt).length;
    return { ...session, completedCount };
  }

  // ── Gestion des élèves d'une session ───────────────────────────────────────

  private async findStudentInScope(sessionId: string, guestId: string, user: AuthUser) {
    const guest = await this.prisma.guestStudent.findFirst({
      where: { id: guestId, diagnosticSession: { id: sessionId, ...this.scope(user) } },
      select: { id: true },
    });
    if (!guest) throw new NotFoundException('Élève introuvable');
    return guest;
  }

  async setStudentExcluded(sessionId: string, guestId: string, excluded: boolean, user: AuthUser) {
    await this.findStudentInScope(sessionId, guestId, user);
    return this.prisma.guestStudent.update({
      where: { id: guestId },
      data: { excludedAt: excluded ? new Date() : null },
      select: { id: true, excludedAt: true },
    });
  }

  // Suppression définitive : ses réponses d'abord (pas de cascade en base).
  async removeStudent(sessionId: string, guestId: string, user: AuthUser) {
    await this.findStudentInScope(sessionId, guestId, user);
    await this.prisma.$transaction([
      this.prisma.diagnosticResponse.deleteMany({ where: { guestStudentId: guestId } }),
      this.prisma.guestStudent.delete({ where: { id: guestId } }),
    ]);
  }

  findByAccessCode(accessCode: string) {
    return this.prisma.diagnosticSession.findUnique({ where: { accessCode } });
  }

  async update(id: string, user: AuthUser, dto: UpdateDiagnosticSessionDto) {
    // organizationId/createdByUserId ne sont jamais modifiables via l'update, même si présents dans le body
    const { organizationId: _orgId, createdByUserId: _ownerId, ...data } = dto;
    const { count } = await this.prisma.diagnosticSession.updateMany({
      where: { id, ...this.scope(user) },
      data,
    });
    if (count === 0) throw new NotFoundException('Session introuvable');
    return this.prisma.diagnosticSession.findUnique({ where: { id } });
  }

  // Suppression définitive : on retire d'abord les réponses et élèves invités liés
  // (pas de cascade en base), le tout dans une transaction.
  async remove(id: string, user: AuthUser) {
    const found = await this.prisma.diagnosticSession.findFirst({
      where: { id, ...this.scope(user) },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('Session introuvable');

    await this.prisma.$transaction(async (tx) => {
      const guests = await tx.guestStudent.findMany({
        where: { diagnosticSessionId: id },
        select: { id: true },
      });
      const guestIds = guests.map((g) => g.id);

      await tx.diagnosticResponse.deleteMany({ where: { sessionId: id } });
      if (guestIds.length) {
        await tx.diagnosticResponse.deleteMany({ where: { guestStudentId: { in: guestIds } } });
        await tx.guestStudent.deleteMany({ where: { id: { in: guestIds } } });
      }
      await tx.diagnosticSession.delete({ where: { id } });
    });
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}
