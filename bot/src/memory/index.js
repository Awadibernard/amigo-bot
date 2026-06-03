// ============================================================
// MÉMOIRE PERSISTANTE D'AYUMI
// ------------------------------------------------------------
// Stocke des infos durables sur les utilisateurs et le groupe.
// Tables : memories, facts, events, leaderboard
// ============================================================
import { db } from "../db/index.js";

// --- Schéma (idempotent) ---
db.exec(`
  CREATE TABLE IF NOT EXISTS memories (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_jid  TEXT NOT NULL,
    key       TEXT NOT NULL,
    value     TEXT NOT NULL,
    ts        INTEGER NOT NULL,
    UNIQUE(user_jid, key)
  );
  CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_jid);

  CREATE TABLE IF NOT EXISTS facts (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    scope     TEXT NOT NULL,        -- 'group' ou un group_jid
    text      TEXT NOT NULL,
    ts        INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_facts_scope ON facts(scope, ts DESC);

  CREATE TABLE IF NOT EXISTS events (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    group_jid TEXT NOT NULL,
    kind      TEXT NOT NULL,
    payload   TEXT,
    ts        INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS leaderboard (
    user_jid     TEXT PRIMARY KEY,
    display_name TEXT,
    points       INTEGER NOT NULL DEFAULT 0,
    wins         INTEGER NOT NULL DEFAULT 0,
    played       INTEGER NOT NULL DEFAULT 0
  );
`);

const now = () => Date.now();

// ============== MEMORIES (clé/valeur par user) ==============
const upsertMem = db.prepare(`
  INSERT INTO memories (user_jid, key, value, ts) VALUES (?, ?, ?, ?)
  ON CONFLICT(user_jid, key) DO UPDATE SET value=excluded.value, ts=excluded.ts
`);
export function saveMemory(userJid, key, value) {
  upsertMem.run(userJid, String(key).toLowerCase().slice(0, 64), String(value).slice(0, 500), now());
}

const listMemStmt = db.prepare(
  `SELECT key, value, ts FROM memories WHERE user_jid = ? ORDER BY ts DESC LIMIT ?`,
);
export function listMemories(userJid, limit = 20) {
  return listMemStmt.all(userJid, limit);
}

const searchMemStmt = db.prepare(
  `SELECT user_jid, key, value FROM memories
   WHERE key LIKE ? OR value LIKE ? ORDER BY ts DESC LIMIT ?`,
);
export function searchMemory(query, limit = 10) {
  const q = `%${query}%`;
  return searchMemStmt.all(q, q, limit);
}

const delMemStmt = db.prepare(`DELETE FROM memories WHERE user_jid = ? AND key = ?`);
export function deleteMemory(userJid, key) {
  return delMemStmt.run(userJid, String(key).toLowerCase()).changes;
}

const delAllMemStmt = db.prepare(`DELETE FROM memories WHERE user_jid = ?`);
export function clearMemories(userJid) {
  return delAllMemStmt.run(userJid).changes;
}

const countMemStmt = db.prepare(`SELECT COUNT(*) AS c FROM memories`);
const lastMemStmt = db.prepare(
  `SELECT user_jid, key, value, ts FROM memories ORDER BY ts DESC LIMIT ?`,
);
export function memoryStats() {
  return {
    total: countMemStmt.get().c,
    last: lastMemStmt.all(5),
  };
}

/**
 * Texte court résumant ce qu'Ayumi sait d'un user (pour injecter dans le prompt).
 */
export function getUserContext(userJid, max = 8) {
  const mems = listMemories(userJid, max);
  if (!mems.length) return "";
  return mems.map((m) => `- ${m.key} : ${m.value}`).join("\n");
}

// ============== FACTS (mémoire de groupe) ==============
const insertFact = db.prepare(
  `INSERT INTO facts (scope, text, ts) VALUES (?, ?, ?)`,
);
export function addFact(scope, text) {
  insertFact.run(scope || "group", String(text).slice(0, 500), now());
}
const listFactsStmt = db.prepare(
  `SELECT text, ts FROM facts WHERE scope = ? ORDER BY ts DESC LIMIT ?`,
);
export function listFacts(scope = "group", limit = 10) {
  return listFactsStmt.all(scope, limit);
}

// ============== EVENTS ==============
const insertEvent = db.prepare(
  `INSERT INTO events (group_jid, kind, payload, ts) VALUES (?, ?, ?, ?)`,
);
export function logEvent(groupJid, kind, payload = null) {
  insertEvent.run(
    groupJid || "",
    kind,
    payload ? JSON.stringify(payload) : null,
    now(),
  );
}

// ============== LEADERBOARD ==============
const upsertScore = db.prepare(`
  INSERT INTO leaderboard (user_jid, display_name, points, wins, played)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(user_jid) DO UPDATE SET
    display_name = COALESCE(excluded.display_name, leaderboard.display_name),
    points = leaderboard.points + excluded.points,
    wins   = leaderboard.wins   + excluded.wins,
    played = leaderboard.played + excluded.played
`);
export function addScore(userJid, displayName, { points = 0, wins = 0, played = 0 } = {}) {
  upsertScore.run(userJid, displayName || null, points, wins, played);
}

const topStmt = db.prepare(
  `SELECT user_jid, display_name, points, wins, played
   FROM leaderboard ORDER BY points DESC, wins DESC LIMIT ?`,
);
export function topPlayers(limit = 10) {
  return topStmt.all(limit);
}

// Ré-exports pratiques pour le context builder
export { latestSummary, summariesCount } from "./summarizer.js";
