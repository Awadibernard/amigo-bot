// ============================================================
// THREADS — graphe simple des fils conversationnels du groupe.
// Fenêtre glissante des N derniers messages avec qui parle à qui.
// Le script DÉCIDE seul ; pas d'appel IA ici.
// ============================================================
import { normalizeJid } from "../utils/jid.js";

const WINDOW = 50;
const threads = new Map(); // groupJid -> [{ts, userJid, text, mentions, quotedJid}]

export function recordMessage(groupJid, entry) {
  if (!groupJid) return;
  const list = threads.get(groupJid) || [];
  list.push({
    ts: Date.now(),
    userJid: normalizeJid(entry.userJid),
    text: entry.text || "",
    mentions: (entry.mentions || []).map(normalizeJid),
    quotedJid: entry.quotedJid ? normalizeJid(entry.quotedJid) : null,
    fromBot: !!entry.fromBot,
  });
  while (list.length > WINDOW) list.shift();
  threads.set(groupJid, list);
}

export function recentThread(groupJid, n = WINDOW) {
  return (threads.get(groupJid) || []).slice(-n);
}

/**
 * Retourne true si le user récemment (60s) interagit dans un fil
 * humain↔humain qui n'implique PAS le bot.
 */
export function inHumanThread(groupJid, userJid, botJid) {
  const now = Date.now();
  const b = normalizeJid(botJid);
  const u = normalizeJid(userJid);
  const list = (threads.get(groupJid) || []).filter(
    (m) => now - m.ts < 60_000,
  );
  if (!list.length) return false;
  // Quelqu'un a-t-il mentionné/répondu à ce user récemment, sans toucher au bot ?
  const others = list.filter(
    (m) =>
      m.userJid !== u &&
      m.userJid !== b &&
      !m.fromBot &&
      (m.mentions.includes(u) ||
        m.quotedJid === u ||
        // simple "Kevin tu ..." => mention par prénom non détectée ici,
        // mais on capte au moins échange direct
        true) &&
      !m.mentions.includes(b) &&
      m.quotedJid !== b,
  );
  return others.length >= 1;
}

/**
 * Ayumi a-t-elle posé une question récemment (≤ windowMs) ?
 */
export function lastBotQuestionAt(groupJid, botJid, windowMs = 120_000) {
  const b = normalizeJid(botJid);
  const list = threads.get(groupJid) || [];
  for (let i = list.length - 1; i >= 0; i--) {
    const m = list[i];
    if (Date.now() - m.ts > windowMs) return 0;
    if ((m.fromBot || m.userJid === b) && /\?\s*$/.test(m.text.trim())) {
      return m.ts;
    }
  }
  return 0;
}

export function _resetThreadsForTests() {
  threads.clear();
}

export function debugThreads() {
  const out = {};
  for (const [g, l] of threads) {
    out[g] = l.slice(-15).map((m) => ({
      ts: m.ts,
      user: m.userJid,
      bot: m.fromBot,
      text: m.text.slice(0, 80),
      mentions: m.mentions,
      quotedJid: m.quotedJid,
    }));
  }
  return out;
}
