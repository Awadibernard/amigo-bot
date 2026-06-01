import { requireAdmin } from "./_admin.js";
import { warnUser } from "../moderation/warnings.js";
import { jidToNumber } from "../utils/text.js";

export async function warn({ args, userJid, mentioned, quotedJid }) {
  const denied = requireAdmin(userJid);
  if (denied) return denied;

  const target = mentioned?.[0] || quotedJid;
  if (!target) return "Mentionne quelqu'un ou réponds à son message : /warn @x raison";

  const reason = args.filter((a) => !a.startsWith("@")).join(" ") || "non précisée";
  const { total, overLimit } = warnUser(target, reason);

  const tag = `@${jidToNumber(target)}`;
  let msg = `⚠️ ${tag} a reçu un warn (${total}). Raison : ${reason}.`;
  if (overLimit) msg += `\nLimite atteinte — calmez-vous svp.`;
  return { text: msg, mentions: [target] };
}
