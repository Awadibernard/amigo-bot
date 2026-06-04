// ============================================================
// SESSIONS DE DISCUSSION
// État conversationnel court par (groupJid, userJid).
// TTL glissant : chaque tour reçu prolonge l'expiration.
// ============================================================
import { config } from "../config.js";

const TTL_MS = 3 * 60 * 1000; // 3 minutes
const sessions = new Map();

const key = (g, u) => `${g}::${u}`;

export function openSession(groupJid, userJid, { ayumiAsked = false } = {}) {
  if (!config.conversationalMode) return;
  sessions.set(key(groupJid, userJid), {
    groupJid,
    userJid,
    ayumiAsked,
    openedAt: Date.now(),
    expiresAt: Date.now() + TTL_MS,
  });
}

export function touchSession(groupJid, userJid) {
  if (!config.conversationalMode) return;
  const s = sessions.get(key(groupJid, userJid));
  if (!s) return;
  s.expiresAt = Date.now() + TTL_MS;
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

export function getSession(groupJid, userJid) {
  const s = sessions.get(key(groupJid, userJid));
  if (!s) return null;
  if (Date.now() > s.expiresAt) {
    sessions.delete(key(groupJid, userJid));
    return null;
  }
  return s;
}

export function closeSession(groupJid, userJid) {
  sessions.delete(key(groupJid, userJid));
}

export function activeSessions() {
  const now = Date.now();
  const out = [];
  for (const [k, s] of sessions) {
    if (now > s.expiresAt) sessions.delete(k);
    else out.push({ ...s, expiresInMs: s.expiresAt - now });
  }
  return out;
}

export function activeSessionsCount() {
  return activeSessions().length;
}
