// ============================================================
// RESOLVER — décide à qui un message est destiné.
// Cascade : Certitude → Contexte → Conversations parallèles → IA (optionnelle).
// Retourne : { target: "ayumi"|"other"|"game", confidence, reason }
// ============================================================
import { config } from "../config.js";
import { normalizeJid } from "../utils/jid.js";
import { hasSession, getSession } from "../sessions/index.js";
import { hasActiveGame, awaitingPlayer } from "../games/engine.js";
import { inHumanThread, lastBotQuestionAt } from "./threads.js";

const BOT_TRIGGER_RE = /\bayumi\b/i;

/**
 * @param {{
 *   text:string, userJid:string, groupJid:string, botJid:string,
 *   mentioned?:string[], quotedJid?:string|null,
 *   isCommand?:boolean
 * }} ctx
 */
export function resolveAddressee(ctx) {
  const text = (ctx.text || "").trim();
  const user = normalizeJid(ctx.userJid);
  const bot = normalizeJid(ctx.botJid);
  const mentions = (ctx.mentioned || []).map(normalizeJid);
  const quotedJid = ctx.quotedJid ? normalizeJid(ctx.quotedJid) : null;

  // === N1 : Certitude ===
  if (ctx.isCommand) {
    return { target: "ayumi", confidence: 1, reason: "command" };
  }
  // Jeu en attente de CE joueur => le jeu mange la réponse
  if (hasActiveGame(ctx.groupJid)) {
    const aw = awaitingPlayer(ctx.groupJid);
    if (aw && normalizeJid(aw) === user) {
      return { target: "game", confidence: 1, reason: "game-awaiting" };
    }
  }
  if (mentions.includes(bot)) {
    return { target: "ayumi", confidence: 1, reason: "mention" };
  }
  if (quotedJid === bot) {
    return { target: "ayumi", confidence: 1, reason: "reply" };
  }

  // === N2 : Contexte récent ===
  // Ayumi a posé une question dans les 90s ET aucun autre fil humain n'a pris le relais
  const askedAt = lastBotQuestionAt(ctx.groupJid, bot, 90_000);
  if (askedAt && !inHumanThread(ctx.groupJid, user, bot)) {
    // session conversationnelle ouverte avec ce user => très probable
    if (hasSession(ctx.groupJid, user)) {
      const s = getSession(ctx.groupJid, user);
      if (s?.ayumiAsked) {
        return { target: "ayumi", confidence: 0.85, reason: "follow-up-session" };
      }
      return { target: "ayumi", confidence: 0.7, reason: "session-after-question" };
    }
  }

  // Session active sans question récente => moins fort, on demande au texte d'avoir un signal
  if (hasSession(ctx.groupJid, user)) {
    if (!inHumanThread(ctx.groupJid, user, bot)) {
      return { target: "ayumi", confidence: 0.65, reason: "session" };
    }
  }

  // Trigger nom "ayumi" dans le texte
  if (BOT_TRIGGER_RE.test(text)) {
    return { target: "ayumi", confidence: 0.9, reason: "trigger-name" };
  }

  // === N3 : Conversations parallèles ===
  if (inHumanThread(ctx.groupJid, user, bot)) {
    return { target: "other", confidence: 0.8, reason: "human-thread" };
  }

  // === Garde-fou : aucun signal positif → other ===
  return { target: "other", confidence: 0.55, reason: "no-signal" };
}

// hook IA optionnel (non utilisé par défaut — script décide seul)
export function shouldArbitrateWithAI(decision) {
  if (!config.addressing?.aiArbitration) return false;
  return decision.target === "other" && decision.confidence < (config.addressing?.confidenceThreshold || 0.7);
}
