import { requireAdmin } from "./_admin.js";
import { logger } from "../logger.js";
import { stats } from "../dashboard/state.js";

/**
 * /del — supprime le message cité (réponse).
 * Le bot doit être admin du groupe pour supprimer les messages des autres.
 * Fonctionne sur tout type de message : texte, lien, média, sticker, réponse.
 */
export async function del({ sock, groupJid, userJid, msg, quotedJid, quotedStanzaId }) {
  const denied = requireAdmin(userJid);
  if (denied) return denied;

  const ctxInfo =
    msg.message?.extendedTextMessage?.contextInfo ||
    msg.message?.imageMessage?.contextInfo ||
    msg.message?.videoMessage?.contextInfo;
  const id = quotedStanzaId || ctxInfo?.stanzaId;
  const participant = quotedJid || ctxInfo?.participant;

  if (!id) {
    logger.warn({ by: userJid }, "/del sans citation");
    return "↩️ Réponds au message à supprimer puis tape /del.";
  }

  const botJid = sock.user?.id?.replace(/:\d+@/, "@") || "";
  const fromMe = participant === botJid;

  try {
    await sock.sendMessage(groupJid, {
      delete: { remoteJid: groupJid, fromMe, id, participant },
    });
    stats.deletes += 1;
    logger.info({ id, participant, by: userJid }, "🗑️  /del OK");
    return null;
  } catch (err) {
    logger.error(
      { err: err?.message, id, participant },
      "/del FAILED (bot pas admin ?)",
    );
    return "❌ Suppression impossible (je dois être admin du groupe).";
  }
}
