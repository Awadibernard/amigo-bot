// ============================================================
// SUMMARIZER — résumés automatiques de conversation.
// Tous les ~50 messages d'un groupe, on demande à Gemini un
// résumé court qu'on stocke. Le dernier résumé est injecté dans
// le contexte IA.
// ============================================================
import { db } from "../db/index.js";
import { logger } from "../logger.js";
import { stats } from "../dashboard/state.js";
import { config } from "../config.js";

db.exec(`
  CREATE TABLE IF NOT EXISTS summaries (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    group_jid     TEXT NOT NULL,
    text          TEXT NOT NULL,
    covers_until  INTEGER NOT NULL,
    ts            INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_summaries_group ON summaries(group_jid, ts DESC);
`);

const SUMMARIZE_EVERY = 50;

const insertSummary = db.prepare(
  `INSERT INTO summaries (group_jid, text, covers_until, ts) VALUES (?, ?, ?, ?)`,
);
const latestSummaryStmt = db.prepare(
  `SELECT text, covers_until, ts FROM summaries
   WHERE group_jid = ? ORDER BY ts DESC LIMIT 1`,
);
const countSummariesStmt = db.prepare(`SELECT COUNT(*) AS c FROM summaries`);

// Compteur en mémoire pour décider quand résumer
const sinceLast = new Map(); // groupJid -> nb messages

export function bumpMessageCounter(groupJid) {
  if (!groupJid) return 0;
  const n = (sinceLast.get(groupJid) || 0) + 1;
  sinceLast.set(groupJid, n);
  return n;
}

export function shouldSummarize(groupJid) {
  return (sinceLast.get(groupJid) || 0) >= SUMMARIZE_EVERY;
}

export function latestSummary(groupJid) {
  if (!groupJid) return "";
  return latestSummaryStmt.get(groupJid)?.text || "";
}

export function summariesCount() {
  return countSummariesStmt.get().c;
}

/**
 * Appel asynchrone (best-effort). On évite tout import circulaire avec Gemini.
 */
export async function maybeSummarize({ groupJid, recentText }) {
  if (!groupJid || !recentText || recentText.length < 200) return;
  try {
    const { askAyumi } = await import("../ai/gemini.js");
    const prompt =
      "Résume en 5 puces très courtes les éléments importants de cette conversation de groupe (sujets, anecdotes, infos perso révélées). Sois factuel, pas de fioritures.\n\n---\n" +
      recentText.slice(-6000);
    const text = await askAyumi({
      userJid: "system",
      userName: "system",
      userMessage: prompt,
      historyOverride: [],
      systemExtras: "Tu es un assistant de synthèse interne. Réponds uniquement par 5 puces concises.",
      bypassQuota: true,
      isInternal: true,
    });
    if (!text || text.startsWith("⚠️") || text.startsWith("⏱")) return;
    insertSummary.run(groupJid, text.slice(0, 2000), Date.now(), Date.now());
    sinceLast.set(groupJid, 0);
    stats.summariesStored = summariesCount();
    logger.info({ groupJid, len: text.length }, "📝 Résumé stocké");
  } catch (err) {
    logger.warn({ err: err?.message }, "summarize failed");
  }
}
