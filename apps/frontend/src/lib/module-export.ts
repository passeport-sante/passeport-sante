import { authHeaders } from "./auth";
import { GAME_TYPE_META, type GameType } from "./steps-admin";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

// ── Types (forme renvoyée par GET /api/modules/:id, cf. findOne backend) ─────

type Json = Record<string, unknown>;

interface ExportGameData {
  questionData: Json;
  correctAnswer: Json | null;
}
interface ExportStep {
  id: string;
  kind: "GAME" | "CONTENT";
  order: number;
  gameType: GameType | null;
  content: Json | null;
  gameData: ExportGameData[];
}
interface ExportModule {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  duration: number | null;
  category: { name: string } | null;
  steps: ExportStep[];
}

// ── Récupération ──────────────────────────────────────────────────────────────

export async function fetchModuleForExport(id: string): Promise<ExportModule> {
  const res = await fetch(`${API}/api/modules/${id}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Impossible de récupérer le module à exporter");
  return res.json();
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  return value ? [String(value)] : [];
}

// Chaque type de jeu a une forme de données différente : on rend un bloc lisible
// par type, en marquant clairement les bonnes réponses.
function renderGame(gameType: GameType, data: ExportGameData): string {
  const q = data.questionData ?? {};
  const a = data.correctAnswer ?? {};

  switch (gameType) {
    case "QUIZ": {
      const questions = (q.questions as Json[]) ?? [];
      const answers = (a.answers as Record<string, unknown>) ?? {};
      return questions
        .map((qq, i) => {
          const correctIds = toIds(answers[String(qq.id)]);
          const opts = ((qq.options as Json[]) ?? [])
            .map((o) => {
              const ok = correctIds.includes(String(o.id));
              return `<li class="${ok ? "correct" : ""}">${ok ? "✔ " : ""}${esc(o.text)}${ok ? " <em>(bonne réponse)</em>" : ""}</li>`;
            })
            .join("");
          const expl = qq.explanation ? `<p class="expl">💡 ${esc(qq.explanation)}</p>` : "";
          const multi = correctIds.length > 1 ? ` <span class="tag">plusieurs bonnes réponses</span>` : "";
          return `<div class="q"><p class="q-text">${i + 1}. ${esc(qq.text)}${multi}</p><ul>${opts}</ul>${expl}</div>`;
        })
        .join("");
    }
    case "KANBAN": {
      const cats = (q.categories as string[]) ?? [];
      const items = (q.items as string[]) ?? [];
      const map = a as Record<string, string>;
      const rows = items
        .map((it) => `<tr><td>${esc(it)}</td><td class="correct">${esc(map[it] ?? "—")}</td></tr>`)
        .join("");
      return `<p class="muted">Catégories : ${cats.map(esc).join(", ")}</p><table><thead><tr><th>Affirmation</th><th>Bonne catégorie</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
    case "PUZZLE": {
      const items = (q.items as Json[]) ?? [];
      const order = (a.order as string[]) ?? items.map((it) => String(it.id));
      const byId = new Map(items.map((it) => [String(it.id), String(it.text ?? "")]));
      const li = order.map((id, i) => `<li>${i + 1}. ${esc(byId.get(id) ?? "")}</li>`).join("");
      const titleLine = q.title ? `<p class="muted">${esc(q.title)}</p>` : "";
      return `${titleLine}<ol class="ordered">${li}</ol>`;
    }
    case "PHRASE_A_TROU": {
      const phrase = esc(q.phrase).replace(/___+/g, '<span class="blank">___</span>');
      const opts = (q.options as string[]) ?? [];
      const blanks = (a.blanks as string[]) ?? [];
      return `<p class="phrase">${phrase}</p><p class="muted">Mots proposés : ${opts.map(esc).join(", ")}</p><p>Réponses attendues : <span class="correct">${blanks.map(esc).join(", ")}</span></p>`;
    }
    case "SCENARIO": {
      const choices = (q.choices as Json[]) ?? [];
      const correctId = String(a.choiceId ?? "");
      const li = choices
        .map((c) => {
          const ok = String(c.id) === correctId;
          return `<li class="${ok ? "correct" : ""}">${ok ? "✔ " : ""}${esc(c.text)}</li>`;
        })
        .join("");
      const expl = a.explanation ? `<p class="expl">💡 ${esc(a.explanation)}</p>` : "";
      return `<p class="situation">${esc(q.situation)}</p><ul>${li}</ul>${expl}`;
    }
    case "MOTS_CROISES": {
      const words = (q.words as Json[]) ?? [];
      const rows = words
        .map(
          (w) =>
            `<tr><td class="correct">${esc(w.answer)}</td><td>${esc(w.clue)}</td><td class="muted">${esc(w.dir === "V" ? "↓" : "→")} L${esc(w.row)}·C${esc(w.col)}</td></tr>`,
        )
        .join("");
      return `<table><thead><tr><th>Mot</th><th>Définition</th><th>Position</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
    case "HISTOIRE": {
      const items = (q.items as Json[]) ?? [];
      const order = (a.order as string[]) ?? items.map((it) => String(it.id));
      const byId = new Map(items.map((it) => [String(it.id), it]));
      const li = order
        .map((id, i) => {
          const it = byId.get(id) ?? {};
          const img = it.imageUrl ? `<div class="muted">🖼 ${esc(it.imageUrl)}</div>` : "";
          return `<li>${i + 1}. ${esc(it.text)}${img}</li>`;
        })
        .join("");
      return `<ol class="ordered">${li}</ol>`;
    }
    case "SWIPE": {
      const cards = (q.cards as Json[]) ?? [];
      const rows = cards
        .map((c) => {
          const ok = String(c.answer) === "vrai";
          const exp = c.explanation ? ` — <span class="muted">${esc(c.explanation)}</span>` : "";
          return `<tr><td>${esc(c.text)}</td><td class="correct">${ok ? "Vrai" : "Faux"}</td></tr><tr><td colspan="2" class="muted">${exp ? esc(String(c.explanation)) : ""}</td></tr>`;
        })
        .join("");
      return `<table><thead><tr><th>Affirmation</th><th>Réponse</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
    case "CURSEUR": {
      const items = (q.items as Json[]) ?? [];
      const rows = items
        .map((it) => {
          const unit = it.unit ? ` ${esc(String(it.unit))}` : "";
          if (String(it.mode) === "precis") {
            return `<tr><td>${esc(it.text)}</td><td>Précis</td><td class="correct">${esc(it.target ?? 0)}${unit} (exact, pas de marge)</td></tr>`;
          }
          if (String(it.mode) === "estimation") {
            const t = Number(it.target ?? 50);
            const tol = Number(it.tolerance ?? 15);
            const vmin = Number(it.valueMin ?? 0);
            const vmax = Number(it.valueMax ?? 100);
            const toReal = (pos: number) => Math.round(vmin + (pos / 100) * (vmax - vmin));
            return `<tr><td>${esc(it.text)}</td><td>Estimation</td><td class="correct">zone ${toReal(Math.max(0, t - tol))}${unit} – ${toReal(Math.min(100, t + tol))}${unit}</td></tr>`;
          }
          return `<tr><td>${esc(it.text)}</td><td>Opinion</td><td class="muted">${esc(it.leftLabel)} ↔ ${esc(it.rightLabel)}</td></tr>`;
        })
        .join("");
      return `<table><thead><tr><th>Affirmation</th><th>Type</th><th>Réponse / échelle</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
    case "CORPS": {
      const zoneLabels: Record<string, string> = {
        tete: "Tête / Cerveau", coeur: "Cœur", poumons: "Poumons", muscles: "Muscles", os: "Os", corps: "Corps entier",
      };
      const benefits = (q.benefits as Json[]) ?? [];
      const rows = benefits
        .map((b) => `<tr><td>${esc(b.text)}</td><td class="correct">${esc(zoneLabels[String(b.zoneId)] ?? String(b.zoneId))}</td></tr>`)
        .join("");
      return `<table><thead><tr><th>Bienfait</th><th>Zone du corps</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
    case "DIALOGUE": {
      const scenes = (q.scenes as Json[]) ?? [];
      const endings = (q.endings as Json[]) ?? [];
      const startId = String(q.startId ?? "");
      const label = (id: string): string => {
        const si = scenes.findIndex((s) => String(s.id) === id);
        if (si >= 0) return `Scène ${si + 1}`;
        const ei = endings.findIndex((e) => String(e.id) === id);
        if (ei >= 0) return `Fin ${ei + 1}`;
        return "?";
      };
      const scenesHtml = scenes
        .map((s, i) => {
          const isStart = String(s.id) === startId ? ' <span class="tag">départ</span>' : "";
          const choices = ((s.choices as Json[]) ?? [])
            .map((c) => `<li>${esc(c.text)} <span class="muted">→ ${esc(label(String(c.goto)))}</span></li>`)
            .join("");
          return `<div class="q"><p class="q-text">Scène ${i + 1}${isStart}</p><p>${esc(s.text)}</p><ul>${choices}</ul></div>`;
        })
        .join("");
      const tone: Record<string, string> = { good: "✅ bonne", neutral: "🟡 neutre", bad: "🔴 à éviter" };
      const endingsHtml = endings
        .map((e, i) => `<tr><td>Fin ${i + 1}</td><td>${esc(tone[String(e.tone)] ?? String(e.tone))}</td><td>${esc(e.text)}</td></tr>`)
        .join("");
      return `${scenesHtml}<p class="q-text">Fins</p><table><thead><tr><th>#</th><th>Type</th><th>Message</th></tr></thead><tbody>${endingsHtml}</tbody></table>`;
    }
    default:
      return `<pre class="raw">${esc(JSON.stringify(q, null, 2))}</pre>`;
  }
}

function renderContent(content: Json): string {
  const type = content.contentType as string;
  if (type === "IMAGE") {
    return `${content.imageUrl ? `<div class="muted">🖼 ${esc(content.imageUrl)}</div>` : ""}${content.caption ? `<p class="cap">${esc(content.caption)}</p>` : ""}`;
  }
  if (type === "VIDEO") {
    return `${content.videoUrl ? `<div class="muted">🎬 ${esc(content.videoUrl)}</div>` : ""}${content.caption ? `<p class="cap">${esc(content.caption)}</p>` : ""}`;
  }
  return content.body ? `<p>${esc(content.body).replace(/\n/g, "<br/>")}</p>` : "";
}

// ── Génération du document ────────────────────────────────────────────────────

export function buildModuleExportHtml(m: ExportModule): string {
  const stepsHtml = m.steps
    .map((step, idx) => {
      const content = step.content ?? {};
      const title = esc(content.title as string) || `Étape ${idx + 1}`;
      const instructions = content.instructions ? `<p class="muted">${esc(content.instructions)}</p>` : "";

      let label: string;
      let body: string;
      if (step.kind === "CONTENT" && !step.gameType) {
        label = "Contenu";
        body = renderContent(content);
      } else if (step.gameType) {
        label = GAME_TYPE_META[step.gameType]?.label ?? step.gameType;
        body = step.gameData.map((gd) => renderGame(step.gameType!, gd)).join("");
      } else {
        label = "Étape";
        body = "";
      }

      const sub = step.kind === "CONTENT" ? '<span class="sub">sous-étape</span>' : "";
      return `<section class="step">
        <div class="step-head"><span class="badge">${esc(label)}</span>${sub}<h2>${title}</h2></div>
        ${instructions}
        <div class="step-body">${body}</div>
      </section>`;
    })
    .join("");

  const meta = [
    m.category?.name ? `Catégorie : ${esc(m.category.name)}` : "",
    m.duration ? `Durée : ${esc(m.duration)} min` : "",
    `${m.steps.length} étape${m.steps.length > 1 ? "s" : ""}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"/>
<title>${esc(m.title)} — Contenu du module</title>
<style>
  :root { --ink:#1a2b32; --muted:#6b7d85; --line:#e3e9eb; --accent:#1B6B8A; --ok:#127a5f; --okbg:#e7f5ef; }
  * { box-sizing:border-box; }
  body { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; color:var(--ink); line-height:1.55; max-width:820px; margin:0 auto; padding:40px 24px 80px; }
  header.doc { border-bottom:3px solid var(--accent); padding-bottom:16px; margin-bottom:8px; }
  header.doc h1 { font-size:28px; margin:0 0 6px; }
  header.doc .meta { color:var(--muted); font-size:14px; font-weight:600; }
  header.doc .desc { margin-top:10px; color:#3d4d54; }
  .step { border:1px solid var(--line); border-radius:12px; padding:18px 20px; margin-top:20px; break-inside:avoid; }
  .step-head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:6px; }
  .step-head h2 { font-size:18px; margin:0; flex:1 1 100%; order:3; }
  .badge { background:var(--accent); color:#fff; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; padding:3px 9px; border-radius:6px; }
  .sub { font-size:11px; color:var(--muted); font-weight:600; text-transform:uppercase; }
  .muted { color:var(--muted); font-size:13px; }
  .q { margin:12px 0; }
  .q-text { font-weight:600; margin:0 0 6px; }
  ul,ol { margin:6px 0; padding-left:22px; }
  li { margin:3px 0; }
  li.correct, .correct { color:var(--ok); font-weight:600; }
  .ordered li { background:var(--okbg); border-radius:6px; padding:4px 8px; margin:4px 0; list-style:none; }
  .expl { background:#fff8e6; border-left:3px solid #e0b74a; padding:6px 10px; font-size:14px; margin:6px 0; border-radius:0 6px 6px 0; }
  .tag { background:var(--accent); color:#fff; font-size:10px; font-weight:700; padding:2px 7px; border-radius:5px; vertical-align:middle; }
  table { border-collapse:collapse; width:100%; margin:8px 0; font-size:14px; }
  th,td { border:1px solid var(--line); padding:6px 10px; text-align:left; }
  th { background:#f4f7f8; font-size:12px; text-transform:uppercase; letter-spacing:.03em; color:var(--muted); }
  .blank { background:#fff2c7; padding:0 6px; border-radius:4px; font-weight:700; }
  .phrase,.situation { font-size:15px; }
  .cap { font-style:italic; color:var(--muted); }
  .raw { background:#f4f7f8; padding:10px; border-radius:8px; font-size:12px; overflow:auto; }
  @media print { .step { box-shadow:none; } body { padding:0; } }
</style></head>
<body>
  <header class="doc">
    <h1>${esc(m.title)}</h1>
    <div class="meta">${meta}</div>
    ${m.description ? `<p class="desc">${esc(m.description)}</p>` : ""}
  </header>
  ${stepsHtml}
</body></html>`;
}

// Récupère le module, génère le HTML et déclenche le téléchargement du fichier.
export async function downloadModuleExport(id: string, slug: string): Promise<void> {
  const m = await fetchModuleForExport(id);
  const html = buildModuleExportHtml(m);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `module-${slug || id}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
