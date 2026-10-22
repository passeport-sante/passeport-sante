import type { ClassLevel, QuestionMeta } from "./dashboard";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

// ── Types renvoyés par GET /api/stats ─────────────────────────────────────────

export type StatsFilters = {
  schoolYear?: string;
  level?: ClassLevel | "NONE";
  className?: string;
  department?: string;
  organizationId?: string;
};

export type StatsOrganization = {
  id: string;
  name: string;
  city: string | null;
  postalCode: string | null;
  department: string | null;
};

export type StatsQuestion = {
  question: QuestionMeta;
  totalAnswered: number;
  correctCount: number;
  incorrectCount: number;
  answerCounts: Record<string, number>;
};

export type StatsModuleStep = {
  step: { id: string; order: number; gameType: string | null; content: { title?: string } | null };
  attempts: number;
  correctCount: number;
  incorrectCount: number;
  successRate: number | null;
};

export type StatsModule = {
  module: { id: string; title: string; colorPrimary: string | null };
  sessions: number;
  students: number;
  completed: number;
  responses: number;
  successRate: number | null;
  steps: StatsModuleStep[];
};

export type StatsBreakdownRow = {
  label: string;
  sublabel: string | null;
  diagSessions: number;
  diagStudents: number;
  diagCompleted: number;
  diagAvgScore: number | null;
  moduleSessions: number;
  moduleStudents: number;
  moduleSuccessRate: number | null;
};

export type StatsResult = {
  scope: "global" | "organization";
  breakdownBy: "organization" | "class";
  filters: {
    organizations: StatsOrganization[];
    departments: string[];
    schoolYears: string[];
    classes: string[];
    classFilterEnabled: boolean;
  };
  diagnostic: {
    sessions: number;
    students: number;
    completed: number;
    responses: number;
    avgScore: number | null;
    questions: StatsQuestion[];
  };
  modules: {
    sessions: number;
    students: number;
    responses: number;
    successRate: number | null;
    modules: StatsModule[];
  };
  breakdown: StatsBreakdownRow[];
};

export async function fetchStats(filters: StatsFilters, token: string): Promise<StatsResult> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  const res = await fetch(`${API}/api/stats?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Impossible de charger les statistiques");
  return res.json();
}

// ── Départements ──────────────────────────────────────────────────────────────

export const DEPARTMENT_NAMES: Record<string, string> = {
  "01": "Ain", "02": "Aisne", "03": "Allier", "04": "Alpes-de-Haute-Provence", "05": "Hautes-Alpes",
  "06": "Alpes-Maritimes", "07": "Ardèche", "08": "Ardennes", "09": "Ariège", "10": "Aube",
  "11": "Aude", "12": "Aveyron", "13": "Bouches-du-Rhône", "14": "Calvados", "15": "Cantal",
  "16": "Charente", "17": "Charente-Maritime", "18": "Cher", "19": "Corrèze", "2A": "Corse-du-Sud",
  "2B": "Haute-Corse", "21": "Côte-d'Or", "22": "Côtes-d'Armor", "23": "Creuse", "24": "Dordogne",
  "25": "Doubs", "26": "Drôme", "27": "Eure", "28": "Eure-et-Loir", "29": "Finistère",
  "30": "Gard", "31": "Haute-Garonne", "32": "Gers", "33": "Gironde", "34": "Hérault",
  "35": "Ille-et-Vilaine", "36": "Indre", "37": "Indre-et-Loire", "38": "Isère", "39": "Jura",
  "40": "Landes", "41": "Loir-et-Cher", "42": "Loire", "43": "Haute-Loire", "44": "Loire-Atlantique",
  "45": "Loiret", "46": "Lot", "47": "Lot-et-Garonne", "48": "Lozère", "49": "Maine-et-Loire",
  "50": "Manche", "51": "Marne", "52": "Haute-Marne", "53": "Mayenne", "54": "Meurthe-et-Moselle",
  "55": "Meuse", "56": "Morbihan", "57": "Moselle", "58": "Nièvre", "59": "Nord",
  "60": "Oise", "61": "Orne", "62": "Pas-de-Calais", "63": "Puy-de-Dôme", "64": "Pyrénées-Atlantiques",
  "65": "Hautes-Pyrénées", "66": "Pyrénées-Orientales", "67": "Bas-Rhin", "68": "Haut-Rhin", "69": "Rhône",
  "70": "Haute-Saône", "71": "Saône-et-Loire", "72": "Sarthe", "73": "Savoie", "74": "Haute-Savoie",
  "75": "Paris", "76": "Seine-Maritime", "77": "Seine-et-Marne", "78": "Yvelines", "79": "Deux-Sèvres",
  "80": "Somme", "81": "Tarn", "82": "Tarn-et-Garonne", "83": "Var", "84": "Vaucluse",
  "85": "Vendée", "86": "Vienne", "87": "Haute-Vienne", "88": "Vosges", "89": "Yonne",
  "90": "Territoire de Belfort", "91": "Essonne", "92": "Hauts-de-Seine", "93": "Seine-Saint-Denis",
  "94": "Val-de-Marne", "95": "Val-d'Oise", "971": "Guadeloupe", "972": "Martinique", "973": "Guyane",
  "974": "La Réunion", "976": "Mayotte",
};

export function departmentLabel(code: string): string {
  const name = DEPARTMENT_NAMES[code];
  return name ? `${code} — ${name}` : code;
}
