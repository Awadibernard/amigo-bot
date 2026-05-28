import { requireAdmin } from "./_admin.js";
import { jidToNumber } from "../utils/text.js";
import { db } from "../db/index.js";

const delStmt = db.prepare(`DELETE FROM warnings WHERE user_jid = ?`);

/**
 * /clearwarns @user — réinitialise les warns d'un membre.
 */
export async function clearwarns({ userJid, mentioned, quotedJid }) {
  const denied = requireAdmin(userJid);
  if (denied) return denied;
  const target = mentioned?.[0] || quotedJid;
  if (!target) return "Mentionne quelqu'un : /clearwarns @x";
  delStmt.run(target);
  return {
    text: `🧽 Warns remis à zéro pour @${jidToNumber(target)}.`,
    mentions: [target],
  };
}
