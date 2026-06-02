import { logger } from "../logger.js";
import { config } from "../config.js";
import { trackUser, saveMessage } from "../db/repo.js";
import { detectLink } from "../moderation/antilink.js";
import { isFlood } from "../moderation/antiflood.js";
import { containsBlacklisted } from "../moderation/blacklist.js";
import { detectMediaType, MEDIA_LABEL } from "../moderation/media.js";
import { warnUser } from "../moderation/warnings.js";
import { commands, parseCommand } from "../commands/index.js";
import { askAyumi } from "../ai/gemini.js";
import { recentMessages } from "../db/repo.js";
import { stats } from "../dashboard/state.js";
import { tryAnswer, hasActiveGame } from "../games/index.js";

const BOT_TRIGGER_RE = /\bayumi\b/i;

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
    logger.info({ reason, id: msg.key.id }, "🗑️  message supprimé");
    return true;
  } catch (err) {
    logger.warn(
      { err: err?.message, reason },
      "❌ delete failed (bot pas admin du groupe ?)",
    );
    return false;
  }
}

export async function handleMessage(ctx) {
  const { sock, text, userJid, groupJid, pushName, isFromBot, botJid, msg } = ctx;
  if (isFromBot) return;
  if (!groupJid) return;
  if (config.groupJid && groupJid !== config.groupJid) return;

  trackUser(userJid, pushName);
  saveMessage(userJid, groupJid, text || "");
  stats.messagesSeen += 1;

  // --- Médias (stickers TOUJOURS autorisés) ---
  const media = detectMediaType(msg);
  if (media && media !== "sticker" && config.moderation.blockMedia) {
    const { total } = warnUser(userJid, `média: ${media}`);
    stats.warnsIssued += 1;
    await tryDelete(sock, groupJid, msg, `media:${media}`);
    await sock.sendMessage(groupJid, {
      text: `🚫 Pas de ${MEDIA_LABEL[media] || media} ici, ${pushName || "toi"}. Warn ${total}.`,
    });
    return;
  }

  if (!text) return;

  // --- Liens ---
  if (config.moderation.blockLinks) {
    const link = detectLink(text);
    if (link) {
      const { total } = warnUser(userJid, `lien: ${link}`);
      stats.warnsIssued += 1;
      await tryDelete(sock, groupJid, msg, `link:${link}`);
      await sock.sendMessage(groupJid, {
        text: `🚫 Pas de liens ici (${link}). Warn ${total}.`,
      });
      return;
    }
  }

  // --- Blacklist (insultes + sexuel explicite) ---
  const bad = containsBlacklisted(text);
  if (bad) {
    const { total } = warnUser(userJid, `mot interdit: ${bad}`);
    stats.warnsIssued += 1;
    await tryDelete(sock, groupJid, msg, `blacklist:${bad}`);
    await sock.sendMessage(groupJid, {
      text: `🤐 Langage interdit (${bad}). Warn ${total}.`,
    });
    return;
  }

  if (isFlood(userJid)) {
    await sock.sendMessage(groupJid, {
      text: `🐢 ${pushName || "toi"}, calme le flood.`,
    });
    return;
  }

  // --- Commandes ---
  const cmd = parseCommand(text);
  if (cmd && commands[cmd.name]) {
    stats.commandsRun += 1;
    logger.info({ cmd: cmd.name, by: userJid }, "▶️  commande");
    try {
      const result = await commands[cmd.name]({ ...ctx, args: cmd.args });
      if (result) {
        if (typeof result === "string") {
          await sock.sendMessage(groupJid, { text: result });
        } else {
          await sock.sendMessage(groupJid, result);
        }
      }
    } catch (err) {
      logger.error(
        { err: err?.message, stack: err?.stack, cmd: cmd.name },
        "Command failed",
      );
      await sock.sendMessage(groupJid, { text: "Erreur sur cette commande." });
    }
    return;
  }

  // --- Réponse à un jeu en cours ---
  if (hasActiveGame(groupJid)) {
    const r = tryAnswer(groupJid, userJid, pushName, text);
    if (r?.correct) {
      await sock.sendMessage(groupJid, { text: r.text }, { quoted: msg });
      return;
    }
    // Mauvaise réponse → on laisse passer silencieusement (pas de spam)
  }

  // --- IA légère : seulement si on parle au bot ---
  const isMention = ctx.mentioned?.includes(botJid);
  const isReplyToBot = ctx.quotedJid === botJid;
  const looksAddressed = BOT_TRIGGER_RE.test(text);

  if (isMention || isReplyToBot || looksAddressed) {
    const recent = recentMessages(groupJid, config.ai.historyLength)
      .filter((m) => m.content)
      .map((m) => ({
        role: m.user_jid === botJid ? "assistant" : "user",
        content: m.content,
      }));

    const reply = await askAyumi({
      userJid,
      userName: pushName,
      history: recent.slice(0, -1),
      userMessage: text,
    });
    if (reply) {
      await sock.sendMessage(groupJid, { text: reply }, { quoted: msg });
    }
  }
}
