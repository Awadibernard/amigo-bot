// ============================================================
// SESSIONS DE DISCUSSION
// Conserve un état conversationnel court par (groupJid, userJid).
// Si Ayumi a parlé récemment à un user (ou posé une question),
// la prochaine réponse de ce user est traitée comme adressée à elle.
// ============================================================
import { config } from "../config.js";

const TTL_MS = 3 * 60 * 1000; // 3 minutes
// Clé : `${groupJid}::${userJid}`
const sessions = new Map();

function key(g, u) {
  return `${g}::${u}`;
}

export function openSession(groupJid, userJid, { ayumiAsked = false } = {}) {
  if (!config.conversationalMode) return;
  sessions.set(key(groupJid, userJid), {
    groupJid,
    userJid,
    ayumiAsked,
    expiresAt: Date.now() + TTL_MS,
  });
}

export function hasSession(groupJid, userJid) {
  if (!config.conversationalMode) return false;
  const s = sessions.get(key(groupJid, userJid));
  if (!s) return false;
  if (Date.now() > s.expiresAt) {
    sessions.delete(key(groupJid, userJid));
    return false;
  }
  return true;
}

export function closeSession(groupJid, userJid) {
  sessions.delete(key(groupJid, userJid));
}

export function activeSessions() {
  const now = Date.now();
  const out = [];
  for (const [k, s] of sessions) {
    if (now > s.expiresAt) sessions.delete(k);
    else out.push(s);
  }
  return out;
}

export function activeSessionsCount() {
  return activeSessions().length;
}
