import { db } from "./index.js";

const now = () => Date.now();

// --- users ---
const upsertUserStmt = db.prepare(`
  INSERT INTO users (jid, display_name, first_seen, last_seen, msg_count)
  VALUES (?, ?, ?, ?, 1)
  ON CONFLICT(jid) DO UPDATE SET
    display_name = excluded.display_name,
    last_seen    = excluded.last_seen,
    msg_count    = msg_count + 1
`);
export function trackUser(jid, displayName) {
  upsertUserStmt.run(jid, displayName || null, now(), now());
}

// --- messages ---
const insertMsgStmt = db.prepare(
  `INSERT INTO messages (user_jid, group_jid, content, ts) VALUES (?, ?, ?, ?)`,
);
export function saveMessage(userJid, groupJid, content) {
  insertMsgStmt.run(userJid, groupJid, content || "", now());
}
export function saveBotMessage(botJid, groupJid, content) {
  if (!botJid || !groupJid || !content) return;
  insertMsgStmt.run(botJid, groupJid, content, now());
}

const recentMsgsStmt = db.prepare(
  `SELECT user_jid, content, ts FROM messages
   WHERE group_jid = ? ORDER BY ts DESC LIMIT ?`,
);
export function recentMessages(groupJid, limit = 12) {
  return recentMsgsStmt.all(groupJid, limit).reverse();
}

const lastMsgTsStmt = db.prepare(
  `SELECT ts FROM messages WHERE group_jid = ? ORDER BY ts DESC LIMIT 1`,
);
export function lastMessageTs(groupJid) {
  return lastMsgTsStmt.get(groupJid)?.ts || 0;
}

// --- warnings ---
const insertWarnStmt = db.prepare(
  `INSERT INTO warnings (user_jid, reason, ts) VALUES (?, ?, ?)`,
);
const countWarnStmt = db.prepare(
  `SELECT COUNT(*) AS c FROM warnings WHERE user_jid = ?`,
);
export function addWarning(jid, reason) {
  insertWarnStmt.run(jid, reason || "", now());
  return countWarnStmt.get(jid).c;
}
export function countWarnings(jid) {
  return countWarnStmt.get(jid).c;
}

// --- kv ---
const getKvStmt = db.prepare(`SELECT v FROM kv WHERE k = ?`);
const setKvStmt = db.prepare(
  `INSERT INTO kv(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v`,
);
export function kvGet(k) {
  return getKvStmt.get(k)?.v ?? null;
}
export function kvSet(k, v) {
  setKvStmt.run(k, String(v));
}

// --- stats ---
export function groupStats(groupJid) {
  const total = db
    .prepare(`SELECT COUNT(*) AS c FROM messages WHERE group_jid = ?`)
    .get(groupJid).c;
  const since = now() - 24 * 3600 * 1000;
  const last24 = db
    .prepare(`SELECT COUNT(*) AS c FROM messages WHERE group_jid = ? AND ts >= ?`)
    .get(groupJid, since).c;
  const top = db
    .prepare(
      `SELECT u.display_name, u.jid, COUNT(m.id) AS n
       FROM messages m JOIN users u ON u.jid = m.user_jid
       WHERE m.group_jid = ? AND m.ts >= ?
       GROUP BY m.user_jid ORDER BY n DESC LIMIT 3`,
    )
    .all(groupJid, since);
  return { total, last24, top };
}
