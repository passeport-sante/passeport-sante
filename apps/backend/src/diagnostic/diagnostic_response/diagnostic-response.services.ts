import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateDiagnosticResponseDto } from "./dto/create-diagnostic.dto";
import { UpdateDiagnosticResponseDto } from "./dto/update-diagnostic.dto";

@Injectable()
export class DiagnosticResponseService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDiagnosticResponseDto) {
    const guest = await this.prisma.guestStudent.findUnique({
      where: { id: dto.guestStudentId },
      select: { diagnosticSessionId: true, completedAt: true },
    });
    if (!guest || guest.diagnosticSessionId !== dto.sessionId) {
      throw new BadRequestException("Élève inconnu pour cette session");
    }

    const question = await this.prisma.diagnosticQuestion.findUnique({
      where: { id: dto.questionId },
      select: { correctAnswer: true, questionType: true },
    });

    const isCorrect = this.computeIsCorrect(
      question?.correctAnswer as Record<string, any> | null,
      question?.questionType ?? null,
      dto.userAnswer,
    );

    // Une réponse déjà enregistrée pour cette question est remplacée.
    const response = await this.prisma.diagnosticResponse.upsert({
      where: {
        guestStudentId_questionId: {
          guestStudentId: dto.guestStudentId,
          questionId: dto.questionId,
        },
      },
      create: { ...dto, isCorrect },
      update: { userAnswer: dto.userAnswer, timing: dto.timing, isCorrect },
    });

    if (!guest.completedAt) {
      const [answered, total] = await Promise.all([
        this.prisma.diagnosticResponse.count({ where: { guestStudentId: dto.guestStudentId } }),
        this.prisma.diagnosticQuestion.count(),
      ]);
      if (answered >= total) {
        await this.prisma.guestStudent.update({
          where: { id: dto.guestStudentId },
          data: { completedAt: new Date() },
        });
      }
    }

    return response;
  }

  // Public : permet à l'élève de reprendre son diagnostic après avoir quitté
  // la page. Seul l'élève connaît son identifiant (gardé dans son navigateur).
  async progress(guestStudentId: string, sessionId: string) {
    const guest = await this.prisma.guestStudent.findUnique({
      where: { id: guestStudentId },
      select: {
        diagnosticSessionId: true,
        completedAt: true,
        diagnosticResponses: { select: { questionId: true } },
      },
    });
    if (!guest || guest.diagnosticSessionId !== sessionId) {
      throw new NotFoundException("Élève introuvable");
    }
    return {
      answeredQuestionIds: guest.diagnosticResponses.map((r) => r.questionId),
      completed: guest.completedAt !== null,
    };
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
        // Le frontend envoie { vraiIds, fauxIds } ; on accepte aussi { vrai, faux }.
        const givenVrai = userAnswer.vraiIds ?? userAnswer.vrai ?? [];
        const givenFaux = userAnswer.fauxIds ?? userAnswer.faux ?? [];
        const vraiOk = [...correctAnswer.vrai].sort().join('|') === [...givenVrai].sort().join('|');
        const fauxOk = [...correctAnswer.faux].sort().join('|') === [...givenFaux].sort().join('|');
        return vraiOk && fauxOk;
      }

      case 'OPEN':
        return null;

      default:
        return null;
    }
  }
}
