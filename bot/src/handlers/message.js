import { logger } from "../logger.js";
import { config } from "../config.js";
import { trackUser, saveMessage } from "../db/repo.js";
import { detectLink } from "../moderation/antilink.js";
import { isFlood } from "../moderation/antiflood.js";
import { containsBlacklisted } from "../moderation/blacklist.js";
import { detectMediaType, MEDIA_LABEL } from "../moderation/media.js";
import { warnUser } from "../moderation/warnings.js";
import { commands, parseCommand } from "../commands/index.js";
import { askAyumi } from "../ai/openrouter.js";
import { recentMessages } from "../db/repo.js";

const BOT_TRIGGER_RE = /\bayumi\b/i;

async function tryDelete(sock, groupJid, msg) {
  if (!config.moderation.deleteBlocked) return;
  try {
    await sock.sendMessage(groupJid, { delete: msg.key });
  } catch (err) {
    logger.warn({ err: err?.message }, "delete failed (bot pas admin ?)");
  }
}

/**
 * Routeur principal.
 */
export async function handleMessage(ctx) {
  const { sock, text, userJid, groupJid, pushName, isFromBot, botJid, msg } = ctx;
  if (isFromBot) return;
  if (!groupJid) return;
  if (config.groupJid && groupJid !== config.groupJid) return;

  trackUser(userJid, pushName);
  saveMessage(userJid, groupJid, text || "");

  // --- Modération média (avant tout, même sans texte) ---
  const media = detectMediaType(msg);
  if (media && config.moderation.blockMedia) {
    const { total } = warnUser(userJid, `média: ${media}`);
    await tryDelete(sock, groupJid, msg);
    await sock.sendMessage(groupJid, {
      text: `🚫 Pas de ${MEDIA_LABEL[media] || media} ici, ${pushName || "toi"}. Warn ${total}.`,
    });
    return;
  }

  if (!text) return;


  // --- Modération ---
  const link = detectLink(text);
  if (link) {
    const { total } = warnUser(userJid, `lien: ${link}`);
    await sock.sendMessage(groupJid, {
      text: `🚫 Pas de liens ici (${link}). Warn ${total}.`,
    });
    return;
  }

  const bad = containsBlacklisted(text);
  if (bad) {
    const { total } = warnUser(userJid, `mot interdit: ${bad}`);
    await tryDelete(sock, groupJid, msg);
    await sock.sendMessage(groupJid, {
      text: `🤐 Langage interdit. Warn ${total}.`,
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
      logger.error({ err, cmd: cmd.name }, "Command failed");
      await sock.sendMessage(groupJid, { text: "Erreur sur cette commande." });
    }
    return;
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
      history: recent.slice(0, -1),
      userMessage: text,
    });
    if (reply) {
      await sock.sendMessage(groupJid, { text: reply }, { quoted: msg });
    }
  }
}
