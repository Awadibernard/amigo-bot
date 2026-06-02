import {
  saveMemory,
  listMemories,
  deleteMemory,
  clearMemories,
} from "../memory/index.js";
import { jidToNumber } from "../utils/text.js";

/**
 * /remember <clé> = <valeur>
 *  ex: /remember sport = football
 */
export async function remember({ args, userJid }) {
  const raw = args.join(" ");
  const eq = raw.indexOf("=");
  if (eq < 0) {
    return "Usage : /remember <clé> = <valeur>\nEx : /remember sport = football";
  }
  const key = raw.slice(0, eq).trim();
  const value = raw.slice(eq + 1).trim();
  if (!key || !value) return "Clé ou valeur vide.";
  saveMemory(userJid, key, value);
  return `🧠 Noté : *${key}* → ${value}`;
}

export async function memories({ userJid }) {
  const list = listMemories(userJid, 15);
  if (!list.length) return "🧠 Aucun souvenir pour toi. Utilise /remember.";
  return [
    `🧠 *Souvenirs de ${jidToNumber(userJid)}*`,
    "",
    ...list.map((m) => `• ${m.key} : ${m.value}`),
  ].join("\n");
}

export async function forget({ args, userJid }) {
  const key = args.join(" ").trim();
  if (!key) return "Usage : /forget <clé>  (ou /forget all)";
  if (key === "all" || key === "*") {
    const n = clearMemories(userJid);
    return `🧠 ${n} souvenir(s) oublié(s).`;
  }
  const n = deleteMemory(userJid, key);
  return n ? `🧠 Oublié : ${key}` : `Aucun souvenir avec la clé "${key}".`;
}
