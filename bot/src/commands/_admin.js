import { jidToNumber } from "../utils/text.js";
import { config } from "../config.js";

export function isAdmin(userJid) {
  return config.adminNumbers.includes(jidToNumber(userJid));
}

export function requireAdmin(userJid) {
  return isAdmin(userJid) ? null : "⛔ Réservé aux admins.";
}
