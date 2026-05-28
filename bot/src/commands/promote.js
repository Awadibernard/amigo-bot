import { requireAdmin } from "./_admin.js";
import { jidToNumber } from "../utils/text.js";

export async function promote({ sock, groupJid, userJid, mentioned, quotedJid }) {
  const denied = requireAdmin(userJid);
  if (denied) return denied;
  const target = mentioned?.[0] || quotedJid;
  if (!target) return "Mentionne quelqu'un : /promote @x";
  try {
    await sock.groupParticipantsUpdate(groupJid, [target], "promote");
    return { text: `⬆️ @${jidToNumber(target)} est désormais admin.`, mentions: [target] };
  } catch {
    return "❌ Impossible (je dois être admin).";
  }
}

export async function demote({ sock, groupJid, userJid, mentioned, quotedJid }) {
  const denied = requireAdmin(userJid);
  if (denied) return denied;
  const target = mentioned?.[0] || quotedJid;
  if (!target) return "Mentionne quelqu'un : /demote @x";
  try {
    await sock.groupParticipantsUpdate(groupJid, [target], "demote");
    return { text: `⬇️ @${jidToNumber(target)} n'est plus admin.`, mentions: [target] };
  } catch {
    return "❌ Impossible (je dois être admin).";
  }
}
