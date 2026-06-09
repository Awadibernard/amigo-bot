import { logger } from "../logger.js";
import { config } from "../config.js";
import { trackUser, saveMessage, saveBotMessage } from "../db/repo.js";
import { detectLink } from "../moderation/antilink.js";
import { isFlood } from "../moderation/antiflood.js";
import { containsBlacklisted } from "../moderation/blacklist.js";
import { detectMediaType, MEDIA_LABEL } from "../moderation/media.js";
import { warnUser } from "../moderation/warnings.js";
import { commands, parseCommand } from "../commands/index.js";
import { askAyumi } from "../ai/gemini.js";
import { stats, pushDebug, setLastContext } from "../dashboard/state.js";
import { tryAnswer, hasActiveGame, handleSocialMessage, isSocialGame } from "../games/engine.js";
import { buildAiContext } from "../memory/context.js";
import { extractAndStore } from "../memory/extractor.js";
import {
  bumpMessageCounter,
  shouldSummarize,
  maybeSummarize,
} from "../memory/summarizer.js";
import {
  hasSession,
  openSession,
  closeSession,
  touchSession,
} from "../sessions/index.js";
import { sendChunked } from "../utils/chunk.js";
import { recentMessages } from "../db/repo.js";
import { alreadyProcessed } from "../utils/dedupe.js";
import { recordMessage } from "../addressing/threads.js";
import { resolveAddressee } from "../addressing/resolver.js";
import { moderateSticker } from "../moderation/stickers.js";

const BOT_TRIGGER_RE = /\bayumi\b/i;

function debug(entry) {
  if (config.debugConversation) pushDebug(entry);
}

async function tryDelete(sock, groupJid, msg, reason = "") {
  if (!config.moderation.deleteBlocked) return false;
  try {
    await sock.sendMessage(groupJid, {
      delete: {
        remoteJid: groupJid,
        fromMe: !!msg.key.fromMe,
        id: msg.key.id,
        participant: msg.key.participant || msg.key.remoteJid,
      },
    });
    stats.deletes += 1;
    logger.info({ reason, id: msg.key.id }, "🗑️ message supprimé");
    return true;
  } catch (err) {
    logger.warn({ err: err?.message, reason }, "❌ delete failed");
    return false;
  }
}

async function sendReply(sock, jid, text, msg, botJid) {
  const n = await sendChunked(sock, jid, text, { quoted: msg });
  // Persister la réponse d'Ayumi pour qu'elle apparaisse dans l'historique
  saveBotMessage(botJid, jid, text);
  // Enregistrer dans le fil pour le resolver
  recordMessage(jid, { userJid: botJid, text, fromBot: true, mentions: [], quotedJid: null });
  return n;
}

export async function handleMessage(ctx) {
  const { sock, text, userJid, groupJid, pushName, isFromBot, botJid, msg } = ctx;
  if (isFromBot) return;
  if (!groupJid) return;
  if (config.groupJid && groupJid !== config.groupJid) return;

  // Dédup
  if (alreadyProcessed(msg.key.id)) {
    stats.duplicatesSkipped += 1;
    debug({
      msgId: msg.key.id,
      userJid,
      groupJid,
      decision: "IGNORED",
      reason: "dedupe",
    });
    return;
  }

  trackUser(userJid, pushName);
  saveMessage(userJid, groupJid, text || "");
  stats.messagesSeen += 1;

  const baseDbg = {
    msgId: msg.key.id,
    userJid,
    pushName,
    groupJid,
    text: (text || "").slice(0, 200),
  };

  // --- Stickers : pipeline indépendant AVANT addressing ---
  const media = detectMediaType(msg);
  if (media === "sticker" && config.stickers?.moderation) {
    try {
      // Téléchargement non implémenté ici (dépend de Baileys downloadMediaMessage).
      // On invoque le pipeline avec null si pas de buffer ; classify renvoie skipped.
      const buf = ctx.stickerBuffer || null;
      const decision = await moderateSticker(ctx, buf);
      if (decision.action === "delete") {
        await tryDelete(sock, groupJid, msg, `sticker:${decision.reason}`);
        const { total } = warnUser(userJid, `sticker:${decision.reason}`);
        stats.warnsIssued += 1;
        await sock.sendMessage(groupJid, {
          text: `🚫 Sticker bloqué (${decision.reason}). Warn ${total}.`,
        });
        debug({ ...baseDbg, decision: "IGNORED", reason: `sticker:${decision.reason}` });
        return;
      }
    } catch (err) {
      logger.warn({ err: err?.message }, "sticker moderation failed");
    }
  }
  if (media && media !== "sticker" && config.moderation.blockMedia) {
    const { total } = warnUser(userJid, `média: ${media}`);
    stats.warnsIssued += 1;
    await tryDelete(sock, groupJid, msg, `media:${media}`);
    await sock.sendMessage(groupJid, {
      text: `🚫 Pas de ${MEDIA_LABEL[media] || media} ici, ${pushName || "toi"}. Warn ${total}.`,
    });
    debug({ ...baseDbg, decision: "IGNORED", reason: `moderation:media:${media}` });
    return;
  }

  // Enregistrement du fil conversationnel (avant tout calcul d'adressage)
  if (text) {
    recordMessage(groupJid, {
      userJid,
      text,
      mentions: ctx.mentioned || [],
      quotedJid: ctx.quotedJid,
      fromBot: false,
    });
  }

  if (!text) {
    debug({ ...baseDbg, decision: "IGNORED", reason: "no-text" });
    return;
  }

  if (config.moderation.blockLinks) {
    const link = detectLink(text);
    if (link) {
      const { total } = warnUser(userJid, `lien: ${link}`);
      stats.warnsIssued += 1;
      await tryDelete(sock, groupJid, msg, `link:${link}`);
      await sock.sendMessage(groupJid, {
        text: `🚫 Pas de liens ici (${link}). Warn ${total}.`,
      });
      debug({ ...baseDbg, decision: "IGNORED", reason: "moderation:link" });
      return;
    }
  }

  const bad = containsBlacklisted(text);
  if (bad) {
    const { total } = warnUser(userJid, `mot interdit: ${bad}`);
    stats.warnsIssued += 1;
    await tryDelete(sock, groupJid, msg, `blacklist:${bad}`);
    await sock.sendMessage(groupJid, {
      text: `🤐 Langage interdit (${bad}). Warn ${total}.`,
    });
    debug({ ...baseDbg, decision: "IGNORED", reason: "moderation:blacklist" });
    return;
  }

  if (isFlood(userJid)) {
    await sock.sendMessage(groupJid, {
      text: `🐢 ${pushName || "toi"}, calme le flood.`,
    });
    debug({ ...baseDbg, decision: "IGNORED", reason: "flood" });
    return;
  }

  // --- Commandes ---
  const cmd = parseCommand(text);
  if (cmd && commands[cmd.name]) {
    stats.commandsRun += 1;
    logger.info({ cmd: cmd.name, by: userJid }, "▶️ commande");
    try {
      const result = await commands[cmd.name]({ ...ctx, args: cmd.args });
      if (result) {
        if (typeof result === "string") {
          await sendReply(sock, groupJid, result, msg, botJid);
        } else {
          await sock.sendMessage(groupJid, result);
          if (typeof result?.text === "string")
            saveBotMessage(botJid, groupJid, result.text);
        }
      }
    } catch (err) {
      logger.error({ err: err?.message, cmd: cmd.name }, "Command failed");
      await sock.sendMessage(groupJid, { text: "Erreur sur cette commande." });
    }
    debug({ ...baseDbg, decision: "COMMAND", reason: cmd.name });
    return;
  }

  // --- Jeu en cours ---
  if (hasActiveGame(groupJid)) {
    if (isSocialGame(groupJid)) {
      const r = handleSocialMessage(groupJid, userJid, pushName, text);
      if (r?.text) {
        await sendReply(sock, groupJid, r.text, msg, botJid);
        debug({ ...baseDbg, decision: "GAME", reason: "social-turn" });
        return;
      }
    } else {
      const r = tryAnswer(groupJid, userJid, pushName, text);
      if (r?.correct) {
        await sendReply(sock, groupJid, r.text, msg, botJid);
        debug({ ...baseDbg, decision: "GAME", reason: "correct-answer" });
        return;
      }
    }
  }

  // --- Extraction auto d'infos ---
  try {
    const saved = extractAndStore({ text, userJid });
    if (saved.length) stats.autoFactsExtracted += saved.length;
  } catch (err) {
    logger.warn({ err: err?.message }, "extractor failed");
  }

  // --- Résumé périodique ---
  bumpMessageCounter(groupJid);
  if (shouldSummarize(groupJid)) {
    const recent = recentMessages(groupJid, 60)
      .map((m) => `${m.user_jid === botJid ? "Ayumi" : "user"}: ${m.content}`)
      .join("\n");
    maybeSummarize({ groupJid, recentText: recent });
  }

  // --- Décision d'adressage (Resolver) ---
  const decision = resolveAddressee({
    text,
    userJid,
    groupJid,
    botJid,
    mentioned: ctx.mentioned,
    quotedJid: ctx.quotedJid,
    isCommand: false,
  });
  if (decision.target !== "ayumi") {
    debug({
      ...baseDbg,
      decision: "IGNORED",
      reason: `addressing:${decision.target}:${decision.reason}`,
      confidence: decision.confidence,
    });
    return;
  }
  const reason = decision.reason;

  // --- Contexte ---
  const { systemExtras, history, sizes } = buildAiContext({
    groupJid,
    userJid,
    botJid,
  });
  setLastContext({
    systemExtras,
    history,
    userMessage: text,
    userJid,
    groupJid,
    reason,
    sizes,
  });

  const t0 = Date.now();
  const reply = await askAyumi({
    userJid,
    userName: pushName,
    history: history.slice(0, -1),
    userMessage: text,
    systemExtras,
  });
  const latencyMs = Date.now() - t0;

  if (reply) {
    await sendReply(sock, groupJid, reply, msg, botJid);
    // session glissante + state
    const ayumiAsked = /\?\s*$/.test(reply.trim());
    openSession(groupJid, userJid, { ayumiAsked });
    touchSession(groupJid, userJid);
    debug({
      ...baseDbg,
      decision: "AI",
      reason,
      session: { active: true, ayumiAsked },
      context: { ...sizes },
      reply: { chars: reply.length, latencyMs },
    });
  } else {
    closeSession(groupJid, userJid);
    debug({ ...baseDbg, decision: "AI", reason, replyError: true });
  }
}
