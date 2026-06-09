// Action ou Vérité — niveaux
import { DETENTE } from "./detente.js";
import { SOCIAL } from "./social.js";
import { INTENSE } from "./intense.js";
import { ADULTES } from "./adultes.js";

export const LEVELS = { detente: DETENTE, social: SOCIAL, intense: INTENSE, adultes: ADULTES };

export function getLevel(name) {
  return LEVELS[String(name || "detente").toLowerCase()] || DETENTE;
}
