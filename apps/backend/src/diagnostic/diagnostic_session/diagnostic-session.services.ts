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
    return this.prisma.diagnosticSession.findMany();
  }

  findOne(id: string) {
    return this.prisma.diagnosticSession.findUnique({ where: { id } });
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
