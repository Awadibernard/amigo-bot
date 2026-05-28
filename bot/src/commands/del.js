import { requireAdmin } from "./_admin.js";

/**
 * /del — supprime le message cité (réponse à un message).
 * Le bot doit être admin du groupe.
 */
export async function del({ sock, groupJid, userJid, msg, quotedJid, quotedStanzaId }) {
  const denied = requireAdmin(userJid);
  if (denied) return denied;
  if (!quotedStanzaId) return "↩️ Réponds au message à supprimer avec /del.";

  const key = {
    remoteJid: groupJid,
    fromMe: quotedJid === (msg.key.participant || msg.key.remoteJid),
    id: quotedStanzaId,
    participant: quotedJid,
  };

  try {
    await sock.sendMessage(groupJid, { delete: key });
    return null;
  } catch {
    return "❌ Suppression impossible (je dois être admin du groupe).";
  }
}
