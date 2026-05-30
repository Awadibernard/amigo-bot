import { requireAdmin } from "./_admin.js";
import { logger } from "../logger.js";
import { stats } from "../dashboard/state.js";

/**
 * /del — supprime le message cité (réponse).
 * Le bot doit être admin du groupe pour supprimer les messages des autres.
 */
export async function del({ sock, groupJid, userJid, msg, quotedJid, quotedStanzaId }) {
  const denied = requireAdmin(userJid);
  if (denied) return denied;

  const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
  const id = quotedStanzaId || ctxInfo?.stanzaId;
  const participant = quotedJid || ctxInfo?.participant;

  if (!id) return "↩️ Réponds au message à supprimer avec /del.";

  const botJid = sock.user?.id?.replace(/:\d+@/, "@") || "";
  const fromMe = participant === botJid;

  try {
    await sock.sendMessage(groupJid, {
      delete: { remoteJid: groupJid, fromMe, id, participant },
    });
    stats.deletes += 1;
    logger.info({ id, participant }, "🗑️  /del");
    return null;
  } catch (err) {
    logger.warn({ err: err?.message }, "/del failed");
    return "❌ Suppression impossible (je dois être admin du groupe).";
  }
}

