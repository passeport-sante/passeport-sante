import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { AuthUser } from "../auth/decorators/current-user.decorator";
import { NO_LEVEL, StatsQueryDto } from "./dto/stats-query.dto";

type Graded = { isCorrect: boolean | null };

// Pourcentage de réponses correctes parmi les réponses notées (null : rien de noté).
function successRate(items: Graded[]): number | null {
  const graded = items.filter((r) => r.isCorrect !== null);
  if (graded.length === 0) return null;
  return Math.round((graded.filter((r) => r.isCorrect).length / graded.length) * 100);
}

function groupBy<T>(items: T[], key: (item: T) => string | null | undefined): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    if (k == null) continue;
    const list = map.get(k);
    if (list) list.push(item);
    else map.set(k, [item]);
  }
  return map;
}

// Mêmes règles de lecture des réponses que le détail d'une session (frontend
// lib/dashboard.ts) : { answer: "x" }, ancien format { answer: { answer: "x" } },
// ou { answers: [...] } pour le choix multiple.
function answerKeys(userAnswer: unknown): string[] {
  const a = (userAnswer ?? {}) as Record<string, unknown>;
  if (Array.isArray(a.answers)) return a.answers.map(String);
  let raw = a.answer;
  if (raw !== null && typeof raw === "object") raw = (raw as Record<string, unknown>).answer;
  if (raw === null || raw === undefined || raw === "") return [];
  return [String(raw)];
}

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  // Admin et collaborateur voient tous les établissements ; un compte
  // établissement est toujours ramené au sien, quels que soient les filtres envoyés.
  private isGlobal(user: AuthUser) {
    return user.role === "ADMIN" || user.role === "COLLABORATEUR";
  }

  async getStats(user: AuthUser, q: StatsQueryDto) {
    const global = this.isGlobal(user);

    const orgWhere: Prisma.OrganizationWhereInput = global
      ? {
          ...(q.department ? { department: q.department } : {}),
          ...(q.organizationId ? { id: q.organizationId } : {}),
        }
      : { id: user.organizationId };

    // Sans établissement précis, un nom de classe ("6e B") n'a pas de sens :
    // il existe dans tous les collèges. Le filtre classe est alors ignoré.
    const singleOrg = !global || !!q.organizationId;
    const className = singleOrg ? q.className : undefined;

    const sessionWhere = {
      organization: orgWhere,
      ...(q.schoolYear ? { schoolYear: q.schoolYear } : {}),
      ...(q.level ? { level: q.level === NO_LEVEL ? null : q.level } : {}),
      ...(className ? { className } : {}),
    };

    const [filters, diagnostic, modules] = await Promise.all([
      this.filterOptions(global, orgWhere, q, singleOrg),
      this.diagnosticStats(sessionWhere),
      this.moduleStats(sessionWhere),
    ]);

    const breakdownBy = singleOrg ? "class" : "organization";
    const breakdown = this.breakdown(breakdownBy, diagnostic.bySession, modules.bySession);

    return {
      scope: global ? "global" : "organization",
      breakdownBy,
      filters,
      diagnostic: diagnostic.summary,
      modules: modules.summary,
      breakdown,
    };
  }

  // ── Options des filtres ───────────────────────────────────────────────────

  private async filterOptions(
    global: boolean,
    orgWhere: Prisma.OrganizationWhereInput,
    q: StatsQueryDto,
    singleOrg: boolean,
  ) {
    const organizations = await this.prisma.organization.findMany({
      where: global ? {} : { id: orgWhere.id as string },
      select: { id: true, name: true, city: true, postalCode: true, department: true },
      orderBy: { name: "asc" },
    });

    const scoped = { organization: orgWhere };
    const [diagYears, modYears] = await Promise.all([
      this.prisma.diagnosticSession.findMany({ where: scoped, select: { schoolYear: true }, distinct: ["schoolYear"] }),
      this.prisma.moduleSession.findMany({ where: scoped, select: { schoolYear: true }, distinct: ["schoolYear"] }),
    ]);
    const schoolYears = [...new Set([...diagYears, ...modYears].map((s) => s.schoolYear))].sort().reverse();

    // Classes de l'établissement, restreintes à l'année et au niveau choisis.
    let classes: string[] = [];
    if (singleOrg) {
      const classWhere = {
        organization: orgWhere,
        ...(q.schoolYear ? { schoolYear: q.schoolYear } : {}),
        ...(q.level ? { level: q.level === NO_LEVEL ? null : q.level } : {}),
      };
      const [d, m] = await Promise.all([
        this.prisma.diagnosticSession.findMany({ where: classWhere, select: { className: true }, distinct: ["className"] }),
        this.prisma.moduleSession.findMany({ where: classWhere, select: { className: true }, distinct: ["className"] }),
      ]);
      classes = [...new Set([...d, ...m].map((s) => s.className))].sort((a, b) => a.localeCompare(b, "fr"));
    }

    const departments = [...new Set(organizations.map((o) => o.department).filter((d): d is string => !!d))].sort();

    return { organizations, departments, schoolYears, classes, classFilterEnabled: singleOrg };
  }

  // ── Diagnostic ────────────────────────────────────────────────────────────

  private async diagnosticStats(sessionWhere: Prisma.DiagnosticSessionWhereInput) {
    const sessions = await this.prisma.diagnosticSession.findMany({
      where: sessionWhere,
      select: {
        id: true,
        className: true,
        schoolYear: true,
        organizationId: true,
        organization: { select: { name: true, city: true } },
      },
    });
    const ids = sessions.map((s) => s.id);

    const [guests, responses, questions] = await Promise.all([
      this.prisma.guestStudent.findMany({
        where: { diagnosticSessionId: { in: ids }, excludedAt: null },
        select: { diagnosticSessionId: true, completedAt: true },
      }),
      this.prisma.diagnosticResponse.findMany({
        where: { sessionId: { in: ids }, guestStudent: { excludedAt: null } },
        select: { questionId: true, userAnswer: true, isCorrect: true, sessionId: true },
      }),
      this.prisma.diagnosticQuestion.findMany({
        select: { id: true, questionText: true, questionType: true, order: true, options: true, correctAnswer: true },
        orderBy: { order: "asc" },
      }),
    ]);

    // Répartition des réponses par question (les mêmes données que le détail
    // d'une session, mais additionnées sur toutes les sessions filtrées).
    const perQuestion = new Map<string, { total: number; correct: number; incorrect: number; counts: Record<string, number> }>();
    for (const r of responses) {
      let agg = perQuestion.get(r.questionId);
      if (!agg) perQuestion.set(r.questionId, (agg = { total: 0, correct: 0, incorrect: 0, counts: {} }));
      agg.total++;
      if (r.isCorrect === true) agg.correct++;
      if (r.isCorrect === false) agg.incorrect++;
      for (const key of answerKeys(r.userAnswer)) agg.counts[key] = (agg.counts[key] ?? 0) + 1;
    }

    const graded = responses.filter((r) => r.isCorrect !== null);
    const correct = graded.filter((r) => r.isCorrect).length;

    const summary = {
      sessions: sessions.length,
      students: guests.length,
      completed: guests.filter((g) => g.completedAt).length,
      responses: responses.length,
      avgScore: graded.length ? Math.round((correct / graded.length) * 100) : null,
      questions: questions
        .filter((qq) => perQuestion.has(qq.id))
        .map((question) => {
          const agg = perQuestion.get(question.id)!;
          return {
            question,
            totalAnswered: agg.total,
            correctCount: agg.correct,
            incorrectCount: agg.incorrect,
            answerCounts: agg.counts,
          };
        }),
    };

    const guestsBySession = groupBy(guests, (g) => g.diagnosticSessionId);
    const responsesBySession = groupBy(responses, (r) => r.sessionId);
    const bySession = sessions.map((s) => {
      const sGuests = guestsBySession.get(s.id) ?? [];
      return {
        session: s,
        students: sGuests.length,
        completed: sGuests.filter((g) => g.completedAt).length,
        responses: responsesBySession.get(s.id) ?? [],
      };
    });

    return { summary, bySession };
  }

  // ── Modules ───────────────────────────────────────────────────────────────

  private async moduleStats(sessionWhere: Prisma.ModuleSessionWhereInput) {
    const sessions = await this.prisma.moduleSession.findMany({
      where: sessionWhere,
      select: {
        id: true,
        className: true,
        schoolYear: true,
        organizationId: true,
        organization: { select: { name: true, city: true } },
        moduleId: true,
        module: {
          select: {
            id: true,
            title: true,
            colorPrimary: true,
            steps: {
              where: { kind: "GAME" },
              select: { id: true, order: true, gameType: true, content: true },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });
    const ids = sessions.map((s) => s.id);

    const guests = await this.prisma.guestStudent.findMany({
      where: { sessionId: { in: ids }, excludedAt: null },
      select: { id: true, sessionId: true, moduleProgresses: { select: { moduleId: true, isCompleted: true } } },
    });
    const guestIds = guests.map((g) => g.id);
    const responseWhere = { guestStudentId: { in: guestIds } };
    const select = { stepId: true, isCorrect: true, guestStudentId: true } as const;
    const [kanban, quiz, puzzle] = await Promise.all([
      this.prisma.kanbanResponse.findMany({ where: responseWhere, select }),
      this.prisma.quizResponse.findMany({ where: responseWhere, select }),
      this.prisma.puzzleResponse.findMany({ where: responseWhere, select }),
    ]);
    const responses = [...kanban, ...quiz, ...puzzle];
    const sessionOfGuest = new Map(guests.map((g) => [g.id, g.sessionId]));

    // Par module : sessions, élèves, élèves ayant terminé, réussite par étape.
    const perModule = new Map<string, { module: NonNullable<(typeof sessions)[number]["module"]>; sessionIds: Set<string> }>();
    for (const s of sessions) {
      if (!s.module) continue;
      let entry = perModule.get(s.module.id);
      if (!entry) perModule.set(s.module.id, (entry = { module: s.module, sessionIds: new Set() }));
      entry.sessionIds.add(s.id);
    }

    const modulesList = [...perModule.values()].map(({ module, sessionIds }) => {
      const mGuests = guests.filter((g) => g.sessionId && sessionIds.has(g.sessionId));
      const mGuestIds = new Set(mGuests.map((g) => g.id));
      const mResponses = responses.filter((r) => mGuestIds.has(r.guestStudentId));
      const responsesByStep = groupBy(mResponses, (r) => r.stepId);
      const steps = module.steps.map((step) => {
        const stepResponses = responsesByStep.get(step.id) ?? [];
        const graded = stepResponses.filter((r) => r.isCorrect !== null);
        return {
          step,
          attempts: graded.length,
          correctCount: graded.filter((r) => r.isCorrect).length,
          incorrectCount: graded.filter((r) => r.isCorrect === false).length,
          successRate: successRate(stepResponses),
        };
      });
      return {
        module: { id: module.id, title: module.title, colorPrimary: module.colorPrimary },
        sessions: sessionIds.size,
        students: mGuests.length,
        completed: mGuests.filter((g) => g.moduleProgresses.some((p) => p.moduleId === module.id && p.isCompleted)).length,
        responses: mResponses.length,
        successRate: successRate(mResponses),
        steps,
      };
    });
    modulesList.sort((a, b) => b.students - a.students);

    const summary = {
      sessions: sessions.length,
      students: guests.length,
      responses: responses.length,
      successRate: successRate(responses),
      modules: modulesList,
    };

    const guestsBySession = groupBy(guests, (g) => g.sessionId);
    const responsesBySession = groupBy(responses, (r) => sessionOfGuest.get(r.guestStudentId));
    const bySession = sessions.map((s) => ({
      session: s,
      students: guestsBySession.get(s.id)?.length ?? 0,
      responses: responsesBySession.get(s.id) ?? [],
    }));

    return { summary, bySession };
  }

  // ── Tableau comparatif ────────────────────────────────────────────────────
  // Une ligne par établissement (vue tous établissements) ou par classe
  // (vue d'un établissement), diagnostic et modules côte à côte.

  private breakdown(
    by: "organization" | "class",
    diag: Awaited<ReturnType<StatsService["diagnosticStats"]>>["bySession"],
    mods: Awaited<ReturnType<StatsService["moduleStats"]>>["bySession"],
  ) {
    type Session = { className: string; schoolYear: string; organizationId: string; organization: { name: string; city: string | null } };
    const keyOf = (s: Session) => (by === "organization" ? s.organizationId : `${s.className}|${s.schoolYear}`);
    const rows = new Map<
      string,
      {
        label: string;
        sublabel: string | null;
        diagSessions: number;
        diagStudents: number;
        diagCompleted: number;
        diagResponses: Graded[];
        moduleSessions: number;
        moduleStudents: number;
        moduleResponses: Graded[];
      }
    >();
    const rowFor = (s: Session) => {
      const key = keyOf(s);
      let row = rows.get(key);
      if (!row) {
        row = {
          label: by === "organization" ? s.organization.name : s.className,
          sublabel: by === "organization" ? s.organization.city : s.schoolYear,
          diagSessions: 0,
          diagStudents: 0,
          diagCompleted: 0,
          diagResponses: [],
          moduleSessions: 0,
          moduleStudents: 0,
          moduleResponses: [],
        };
        rows.set(key, row);
      }
      return row;
    };

    for (const d of diag) {
      const row = rowFor(d.session);
      row.diagSessions++;
      row.diagStudents += d.students;
      row.diagCompleted += d.completed;
      row.diagResponses.push(...d.responses);
    }
    for (const m of mods) {
      const row = rowFor(m.session);
      row.moduleSessions++;
      row.moduleStudents += m.students;
      row.moduleResponses.push(...m.responses);
    }

    return [...rows.values()]
      .map(({ diagResponses, moduleResponses, ...row }) => ({
        ...row,
        diagAvgScore: successRate(diagResponses),
        moduleSuccessRate: successRate(moduleResponses),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "fr") || (a.sublabel ?? "").localeCompare(b.sublabel ?? ""));
  }
}
