import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateDiagnosticSessionDto } from "./dto/create-diagnostic.dto";
import { UpdateDiagnosticSessionDto } from "./dto/update-diagnostic.dto";

@Injectable()
export class DiagnosticSessionService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

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

  findAll(organizationId: string) {
    return this.prisma.diagnosticSession.findMany({
      where: { organizationId },
      include: {
        _count: { select: { guestStudents: true, diagnosticResponses: true } },
        createdByUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string, organizationId: string) {
    return this.prisma.diagnosticSession.findFirst({
      where: { id, organizationId },
      include: {
        createdByUser: { select: { id: true, name: true, email: true } },
        _count: { select: { guestStudents: true, diagnosticResponses: true } },
        diagnosticResponses: {
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
  }

  findByAccessCode(accessCode: string) {
    return this.prisma.diagnosticSession.findUnique({ where: { accessCode } });
  }

  async update(id: string, organizationId: string, dto: UpdateDiagnosticSessionDto) {
    // organizationId/createdByUserId ne sont jamais modifiables via l'update, même si présents dans le body
    const { organizationId: _orgId, createdByUserId: _ownerId, ...data } = dto;
    const { count } = await this.prisma.diagnosticSession.updateMany({
      where: { id, organizationId },
      data,
    });
    if (count === 0) throw new NotFoundException('Session introuvable');
    return this.prisma.diagnosticSession.findUnique({ where: { id } });
  }

  async remove(id: string, organizationId: string) {
    const { count } = await this.prisma.diagnosticSession.deleteMany({ where: { id, organizationId } });
    if (count === 0) throw new NotFoundException('Session introuvable');
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}
