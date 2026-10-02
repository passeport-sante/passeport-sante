#!/usr/bin/env node
// Test de charge du Diagnostic Santé : N élèves en parallèle, parcours complet.
//
//   node scripts/load-test-diagnostic.mjs --code ABC123 --students 30
//
// Options (ou variables d'environnement) :
//   --code       code d'accès d'une session de test active          (obligatoire)
//   --students   nombre d'élèves simultanés                          (défaut 30)
//   --api        URL de l'API    (API_URL)      défaut http://localhost:5000
//   --web        URL du frontend (WEB_URL)      défaut http://localhost:3000
//   --think      temps de réflexion max par question, en secondes    (défaut 2)
//                0 = tout le monde enchaîne sans pause (cas extrême)
//   --ramp       étalement des arrivées, en secondes                 (défaut 3)
//
// ⚠️ Crée de vrais élèves invités et de vraies réponses : à lancer sur une
// session de TEST (jetable), jamais sur la session d'une vraie classe.

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);

const CODE = args.code ?? process.env.ACCESS_CODE;
const STUDENTS = Number(args.students ?? 30);
const API = (args.api ?? process.env.API_URL ?? "http://localhost:5000").replace(/\/$/, "");
const WEB = (args.web ?? process.env.WEB_URL ?? "http://localhost:3000").replace(/\/$/, "");
const THINK = Number(args.think ?? 2);
const RAMP = Number(args.ramp ?? 3);

if (!CODE) {
  console.error("Il manque --code <accessCode> (session de test active).");
  process.exit(1);
}

// ── Métriques ────────────────────────────────────────────────────────────────

const lat = {}; // endpoint -> [ms]
const errors = []; // { who, step, detail }
const record = (name, ms) => (lat[name] ??= []).push(ms);

async function timed(name, who, url, init) {
  const t0 = performance.now();
  try {
    const res = await fetch(url, init);
    const body = await res.text();
    record(name, performance.now() - t0);
    if (!res.ok) {
      errors.push({ who, step: name, detail: `HTTP ${res.status} ${body.slice(0, 120)}` });
      return null;
    }
    return body ? JSON.parse(body) : {};
  } catch (e) {
    record(name, performance.now() - t0);
    errors.push({ who, step: name, detail: String(e?.cause?.code ?? e?.message ?? e) });
    return null;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pct = (arr, p) => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)] ?? 0;
};

// ── Réponse plausible selon le type de question ──────────────────────────────

function fakeAnswer(q) {
  const choices = q.options?.choices ?? [];
  switch (q.questionType) {
    case "TRUE_FALSE":
      return { answer: choices[Math.random() < 0.5 ? 0 : 1] };
    case "MCQ":
      return { answer: pick(choices) };
    case "MCQ_MULTI": {
      const chosen = choices.filter(() => Math.random() < 0.4);
      return { answers: chosen.length ? chosen : [pick(choices)] };
    }
    case "OPEN":
      return { answer: "réponse de test" };
    case "CLASSIFY": {
      const items = q.options?.items ?? [];
      const vraiIds = [];
      const fauxIds = [];
      for (const i of items) (Math.random() < 0.5 ? vraiIds : fauxIds).push(i.id);
      return { vraiIds, fauxIds };
    }
    default:
      return { answer: "?" };
  }
}

// ── Un élève ─────────────────────────────────────────────────────────────────

async function student(n) {
  const who = `élève-${String(n).padStart(2, "0")}`;
  const t0 = performance.now();

  await sleep(Math.random() * RAMP * 1000);

  // 1. Page Next.js (SSR : résout le code côté serveur)
  const page = await fetch(`${WEB}/diagnostic/${CODE}`).catch((e) => e);
  if (page instanceof Error || !page.ok) {
    errors.push({ who, step: "page", detail: page.status ?? String(page) });
  }

  // 2. Session + questions + création de l'élève invité (comme le client)
  const session = await timed("GET session", who, `${API}/api/diagnostic/session/by-code/${CODE}`);
  if (!session) return { who, answered: 0, total: 0 };

  const [questions, guest] = await Promise.all([
    timed("GET questions", who, `${API}/api/diagnostic/question`),
    timed("POST guest", who, `${API}/api/guest-studend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diagnosticSessionId: session.id }),
    }),
  ]);
  if (!questions || !guest) return { who, answered: 0, total: 0 };

  // 3. Les réponses, une par une
  let answered = 0;
  for (const q of questions) {
    if (THINK > 0) await sleep(Math.random() * THINK * 1000);
    const ok = await timed("POST response", who, `${API}/api/diagnostic/response`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId: q.id,
        userAnswer: fakeAnswer(q),
        guestStudentId: guest.id,
        sessionId: session.id,
        timing: 1,
      }),
    });
    if (ok) answered++;
  }

  return { who, answered, total: questions.length, secs: (performance.now() - t0) / 1000 };
}

// ── Lancement ────────────────────────────────────────────────────────────────

console.log(`Diagnostic — ${STUDENTS} élèves | API ${API} | web ${WEB} | think ≤ ${THINK}s | ramp ${RAMP}s\n`);
const start = performance.now();
const results = await Promise.all(Array.from({ length: STUDENTS }, (_, i) => student(i + 1)));
const total = (performance.now() - start) / 1000;

console.log(`Terminé en ${total.toFixed(1)} s\n`);
console.log("Endpoint".padEnd(16), "n".padStart(6), "p50".padStart(8), "p95".padStart(8), "max".padStart(8), " (ms)");
for (const [name, v] of Object.entries(lat)) {
  console.log(
    name.padEnd(16),
    String(v.length).padStart(6),
    pct(v, 50).toFixed(0).padStart(8),
    pct(v, 95).toFixed(0).padStart(8),
    Math.max(...v).toFixed(0).padStart(8),
  );
}

const complete = results.filter((r) => r.total > 0 && r.answered === r.total).length;
const sent = results.reduce((s, r) => s + r.answered, 0);
const expected = results.reduce((s, r) => s + r.total, 0);
console.log(`\nParcours complets : ${complete}/${STUDENTS}`);
console.log(`Réponses enregistrées : ${sent}/${expected}`);
console.log(`Erreurs : ${errors.length}`);
for (const e of errors.slice(0, 15)) console.log(`  - ${e.who} [${e.step}] ${e.detail}`);
if (errors.length > 15) console.log(`  … et ${errors.length - 15} autres`);

process.exit(errors.length || complete < STUDENTS ? 1 : 0);
