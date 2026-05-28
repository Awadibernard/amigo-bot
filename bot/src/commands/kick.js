import { requireAdmin } from "./_admin.js";
import { jidToNumber } from "../utils/text.js";

/**
 * /kick @user  — retire un membre du groupe (bot doit être admin)
 */
export async function kick({ sock, groupJid, userJid, mentioned, quotedJid }) {
  const denied = requireAdmin(userJid);
  if (denied) return denied;

  const target = mentioned?.[0] || quotedJid;
  if (!target) return "Mentionne quelqu'un ou réponds à son message : /kick @x";

  try {
    await sock.groupParticipantsUpdate(groupJid, [target], "remove");
    return { text: `👢 @${jidToNumber(target)} a été retiré.`, mentions: [target] };
  } catch {
    return "❌ Impossible de kick (je dois être admin du groupe).";
  }
}
