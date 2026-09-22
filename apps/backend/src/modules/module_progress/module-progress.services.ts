import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateModuleProgressDto } from "./dto/create-module.dto";
import { UpdateModuleProgressDto } from "./dto/update-module.dto";

export interface ProgressState {
  unlockedLevel: number;
  isCompleted: boolean;
  totalLevels: number;
}

@Injectable()
export class ModuleProgressService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateModuleProgressDto) {
    return this.prisma.moduleProgress.create({ data: dto });
  }

  findAll() {
    return this.prisma.moduleProgress.findMany();
  }

  findOne(id: string) {
    return this.prisma.moduleProgress.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateModuleProgressDto) {
    return this.prisma.moduleProgress.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.moduleProgress.delete({ where: { id } });
  }

  // ─── Parcours élève ─────────────────────────────────────────────────────────

  // Avancement d'un élève invité sur un module. Absence de ligne = début du
  // parcours : seule la première étape de jeu est ouverte.
  async getState(guestStudentId: string, moduleId: string): Promise<ProgressState> {
    const [progress, totalLevels] = await Promise.all([
      this.prisma.moduleProgress.findUnique({
        where: { guestStudentId_moduleId: { guestStudentId, moduleId } },
      }),
      this.countGameSteps(moduleId),
    ]);

    return {
      unlockedLevel: Math.min(progress?.unlockedLevel ?? 1, Math.max(totalLevels, 1)),
      isCompleted: progress?.isCompleted ?? false,
      totalLevels,
    };
  }

  // Enregistre qu'une étape vient d'être terminée et ouvre la suivante.
  //
  // Le client annonce l'étape, mais c'est la base qui tranche : on exige qu'une
  // réponse existe pour le jeu concerné (les 12 mini-jeux en enregistrent une).
  // Une étape de contenu intercalée est rattachée au jeu qui la précède, sinon
  // il suffirait de déclarer « j'ai lu l'affiche » pour sauter le jeu d'avant.
  async completeStep(guestStudentId: string, stepId: string): Promise<ProgressState> {
    const step = await this.prisma.step.findUnique({
      where: { id: stepId },
      select: { id: true, order: true, moduleId: true },
    });
    if (!step) throw new NotFoundException("Étape introuvable");

    const guest = await this.prisma.guestStudent.findUnique({
      where: { id: guestStudentId },
      select: { id: true },
    });
    if (!guest) throw new NotFoundException("Élève introuvable");

    const gameSteps = await this.prisma.step.findMany({
      where: { moduleId: step.moduleId, kind: "GAME" },
      orderBy: { order: "asc" },
      select: { id: true, order: true },
    });

    // Rang du dernier jeu situé à cette position ou avant : c'est le niveau que
    // l'élève vient de terminer. Zéro = contenu placé avant le premier jeu,
    // il n'ouvre rien de plus.
    const joues = gameSteps.filter((s) => s.order <= step.order);
    const rang = joues.length;
    if (rang === 0) return this.getState(guestStudentId, step.moduleId);

    const jeuTermine = joues[joues.length - 1]!;
    const aRepondu = await this.hasResponse(guestStudentId, jeuTermine.id);
    if (!aRepondu) {
      throw new BadRequestException("Cette étape n'a pas encore été jouée");
    }

    const total = Math.max(gameSteps.length, 1);
    const unlockedLevel = Math.min(rang + 1, total);
    const isCompleted = rang >= total;
    const completion = Math.min(rang / total, 1);

    // Jamais de régression : rejouer une étape déjà faite ne referme rien.
    const cle = { guestStudentId_moduleId: { guestStudentId, moduleId: step.moduleId } };
    const actuel = await this.prisma.moduleProgress.findUnique({ where: cle });

    if (!actuel) {
      await this.prisma.moduleProgress.create({
        data: { guestStudentId, moduleId: step.moduleId, unlockedLevel, completion, isCompleted },
      });
    } else {
      await this.prisma.moduleProgress.update({
        where: cle,
        data: {
          unlockedLevel: Math.max(unlockedLevel, actuel.unlockedLevel),
          completion: Math.max(completion, actuel.completion),
          isCompleted: actuel.isCompleted || isCompleted,
        },
      });
    }

    return this.getState(guestStudentId, step.moduleId);
  }

  private countGameSteps(moduleId: string): Promise<number> {
    return this.prisma.step.count({ where: { moduleId, kind: "GAME" } });
  }

  // Les mini-jeux enregistrent leur réponse dans l'une de ces trois tables.
  private async hasResponse(guestStudentId: string, stepId: string): Promise<boolean> {
    const where = { guestStudentId, stepId };
    const [kanban, quiz, puzzle] = await Promise.all([
      this.prisma.kanbanResponse.count({ where }),
      this.prisma.quizResponse.count({ where }),
      this.prisma.puzzleResponse.count({ where }),
    ]);
    return kanban + quiz + puzzle > 0;
  }
}
