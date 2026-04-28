import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateModuleSessionDto } from "./dto/create-module.dto";
import { UpdateModuleSessionDto } from "./dto/update-module.dto";

@Injectable()
export class ModuleSessionService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  create(dto: CreateModuleSessionDto) {
    const accessCode = this.generateCode();
    const baseUrl = this.config.get<string>("FRONTEND_URL") ?? "http://localhost:3000";
    const accessUrl = `${baseUrl}/session/${accessCode}`;

    return this.prisma.moduleSession.create({
      data: { ...dto, accessCode, accessUrl },
    });
  }

  findAll() {
    return this.prisma.moduleSession.findMany({
      include: {
        _count: { select: { guestStudents: true } },
        module: { select: { id: true, title: true, colorPrimary: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  findOne(id: string) {
    return this.prisma.moduleSession.findUnique({
      where: { id },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            slug: true,
            colorPrimary: true,
            steps: {
              select: { id: true, order: true, gameType: true, content: true },
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

  update(id: string, dto: UpdateModuleSessionDto) {
    return this.prisma.moduleSession.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.moduleSession.delete({ where: { id } });
  }

  private generateCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }
}
