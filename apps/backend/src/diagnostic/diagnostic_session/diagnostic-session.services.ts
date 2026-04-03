import { Injectable } from "@nestjs/common";
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

  async create(dto: CreateDiagnosticSessionDto) {
    const accessCode = this.generateCode();
    const baseUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const accessUrl = `${baseUrl}/diagnostic/${accessCode}`;

    return this.prisma.diagnosticSession.create({
      data: { ...dto, accessCode, accessUrl },
    });
  }

  findAll() {
    return this.prisma.diagnosticSession.findMany({
      include: {
        _count: { select: { guestStudents: true, diagnosticResponses: true } },
        createdByUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.diagnosticSession.findUnique({
      where: { id },
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

  update(id: string, dto: UpdateDiagnosticSessionDto) {
    return this.prisma.diagnosticSession.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.diagnosticSession.delete({ where: { id } });
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}
