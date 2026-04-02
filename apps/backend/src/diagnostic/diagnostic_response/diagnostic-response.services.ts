import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateDiagnosticResponseDto } from "./dto/create-diagnostic.dto";
import { UpdateDiagnosticResponseDto } from "./dto/update-diagnostic.dto";

@Injectable()
export class DiagnosticResponseService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDiagnosticResponseDto) {
    const question = await this.prisma.diagnosticQuestion.findUnique({
      where: { id: dto.questionId },
      select: { correctAnswer: true, questionType: true },
    });

    const isCorrect = this.computeIsCorrect(
      question?.correctAnswer as Record<string, any> | null,
      question?.questionType ?? null,
      dto.userAnswer,
    );

    return this.prisma.diagnosticResponse.create({
      data: { ...dto, isCorrect },
    });
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

  // ── Logique de correction ───────────────────────────────────────────────────

  private computeIsCorrect(
    correctAnswer: Record<string, any> | null,
    questionType: string | null,
    userAnswer: Record<string, any>,
  ): boolean | null {
    if (!correctAnswer || !questionType) return null;

    switch (questionType) {
      case 'TRUE_FALSE':
      case 'MCQ':
        return correctAnswer.answer === userAnswer.answer;

      case 'MCQ_MULTI': {
        if (!Array.isArray(correctAnswer.answers) || !Array.isArray(userAnswer.answers)) return null;
        const correct = [...correctAnswer.answers].sort().join('|');
        const given   = [...userAnswer.answers].sort().join('|');
        return correct === given;
      }

      case 'CLASSIFY': {
        if (!correctAnswer.vrai || !correctAnswer.faux) return null;
        const vraiOk = [...correctAnswer.vrai].sort().join('|') === [...(userAnswer.vrai ?? [])].sort().join('|');
        const fauxOk = [...correctAnswer.faux].sort().join('|') === [...(userAnswer.faux ?? [])].sort().join('|');
        return vraiOk && fauxOk;
      }

      case 'OPEN':
        return null;

      default:
        return null;
    }
  }
}
