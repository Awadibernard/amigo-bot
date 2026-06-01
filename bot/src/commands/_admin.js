import { jidToNumber } from "../utils/text.js";
import { config } from "../config.js";
import { runtime } from "../runtime.js";

export function isAdmin(userJid) {
  // Mode test OU enforcement désactivé via dashboard → tout le monde est "admin"
  if (config.testMode || !runtime.adminEnforce) return true;
  return config.adminNumbers.includes(jidToNumber(userJid));
}

export function requireAdmin(userJid) {
  return isAdmin(userJid)
    ? null
    : "⛔ Réservé aux admins. (Active TEST_MODE=true ou désactive l'admin dans le dashboard pour tester.)";
}
