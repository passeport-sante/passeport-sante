import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateDiagnosticResponseDto } from "./dto/create-diagnostic.dto";
import { UpdateDiagnosticResponseDto } from "./dto/update-diagnostic.dto";

@Injectable()
export class DiagnosticResponseService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateDiagnosticResponseDto) {
    return this.prisma.diagnosticResponse.create({ data: dto });
  }

  findAll() {
    return this.prisma.diagnosticResponse.findMany();
  }

  findOne(id: string) {
    return this.prisma.diagnosticResponse.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateDiagnosticResponseDto) {
    return this.prisma.diagnosticResponse.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.diagnosticResponse.delete({ where: { id } });
  }
}
