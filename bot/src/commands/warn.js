import { warnUser } from "../moderation/warnings.js";
import { jidToNumber } from "../utils/text.js";
import { config } from "../config.js";

export async function warn({ args, userJid, mentioned, quotedJid }) {
  // Seuls les admins peuvent /warn
  const num = jidToNumber(userJid);
  if (!config.adminNumbers.includes(num)) {
    return "Seuls les admins peuvent utiliser /warn.";
  }

  const target = mentioned?.[0] || quotedJid;
  if (!target) return "Mentionne quelqu'un ou réponds à son message : /warn @x raison";

  const reason = args.filter((a) => !a.startsWith("@")).join(" ") || "non précisée";
  const { total, overLimit } = warnUser(target, reason);

  const tag = `@${jidToNumber(target)}`;
  let msg = `⚠️ ${tag} a reçu un warn (${total}). Raison : ${reason}.`;
  if (overLimit) msg += `\nLimite atteinte — calmez-vous svp.`;
  return { text: msg, mentions: [target] };
}
