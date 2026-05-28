import { getWarnings } from "../moderation/warnings.js";
import { jidToNumber } from "../utils/text.js";

/**
 * /warns [@user] — affiche le nombre de warns (soi-même ou cible).
 */
export async function warns({ userJid, mentioned, quotedJid }) {
  const target = mentioned?.[0] || quotedJid || userJid;
  const n = getWarnings(target);
  return {
    text: `⚠️ @${jidToNumber(target)} a ${n} warn(s).`,
    mentions: [target],
  };
}
