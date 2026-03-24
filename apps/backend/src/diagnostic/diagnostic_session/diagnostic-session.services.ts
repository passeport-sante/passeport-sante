import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateDiagnosticSessionDto } from "./dto/create-diagnostic.dto";
import { UpdateDiagnosticSessionDto } from "./dto/update-diagnostic.dto";

@Injectable()
export class DiagnosticSessionService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateDiagnosticSessionDto) {
    return this.prisma.diagnosticSession.create({ data: dto });
  }

  findAll() {
    return this.prisma.diagnosticSession.findMany();
  }

  findOne(id: string) {
    return this.prisma.diagnosticSession.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateDiagnosticSessionDto) {
    return this.prisma.diagnosticSession.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.diagnosticSession.delete({ where: { id } });
  }
}
