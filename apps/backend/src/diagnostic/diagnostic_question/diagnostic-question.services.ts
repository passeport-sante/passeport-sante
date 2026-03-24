import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateDiagnosticQuestionDto } from "./dto/create-diagnostic.dto";
import { UpdateDiagnosticQuestionDto } from "./dto/update-diagnostic.dto";

@Injectable()
export class DiagnosticQuestionService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateDiagnosticQuestionDto) {
    return this.prisma.diagnosticQuestion.create({ data: dto });
  }

  findAll() {
    return this.prisma.diagnosticQuestion.findMany();
  }

  findOne(id: string) {
    return this.prisma.diagnosticQuestion.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateDiagnosticQuestionDto) {
    return this.prisma.diagnosticQuestion.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.diagnosticQuestion.delete({ where: { id } });
  }
}
