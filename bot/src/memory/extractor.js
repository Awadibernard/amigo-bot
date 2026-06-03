// ============================================================
// EXTRACTEUR D'INFOS UTILISATEUR
// Détecte automatiquement des faits ("mon anniv est le 12/07",
// "j'aime le foot", "je suis dev"…) et les stocke en mémoire.
// ============================================================
import { saveMemory } from "./index.js";
import { logger } from "../logger.js";

const PATTERNS = [
  {
    key: "anniversaire",
    re: /\bmon\s+anniversaire\s+(?:est|c'?est|tombe)\s+(?:le\s+)?([0-9]{1,2}(?:[\/\-\s][0-9]{1,2})(?:[\/\-\s][0-9]{2,4})?|[0-9]{1,2}\s+[a-zéûôîâ]+)/i,
    extract: (m) => m[1].trim(),
  },
  {
    key: "prenom",
    re: /\b(?:mon\s+pr[ée]nom|je\s+m'?appelle|moi\s+c'?est)\s+([A-ZÀ-Ý][a-zà-ÿ\-]{1,20})/,
    extract: (m) => m[1].trim(),
  },
  {
    key: "ville",
    re: /\bj'?habite\s+(?:à|a|en|au)\s+([A-Za-zÀ-ÿ\-\s]{2,30})/i,
    extract: (m) => m[1].trim().split(/[.,!?]/)[0].trim().slice(0, 40),
  },
  {
    key: "metier",
    re: /\bje\s+suis\s+(d[ée]veloppeur(?:se)?|prof|professeur|[ée]tudiant(?:e)?|m[ée]decin|infirmier(?:e|ère)?|avocat(?:e)?|ing[ée]nieur(?:e)?|designer|artiste|musicien(?:ne)?|architecte|journaliste|cuisinier(?:e|ère)?|chauffeur|commer[çc]ant(?:e)?|entrepreneur(?:e)?)/i,
    extract: (m) => m[1].toLowerCase(),
  },
  {
    key: "aime",
    re: /\b(?:j'?aime|j'?adore)\s+(?:le|la|les|l')?\s*([a-zà-ÿ\s\-]{3,30})/i,
    extract: (m) => m[1].trim().split(/[.,!?]/)[0].trim().slice(0, 40),
  },
  {
    key: "deteste",
    re: /\b(?:je\s+d[ée]teste|je\s+hais)\s+(?:le|la|les|l')?\s*([a-zà-ÿ\s\-]{3,30})/i,
    extract: (m) => m[1].trim().split(/[.,!?]/)[0].trim().slice(0, 40),
  },
];

/**
 * Analyse un message et stocke en mémoire les faits détectés.
 * Retourne la liste des clés écrites.
 */
export function extractAndStore({ text, userJid }) {
  if (!text || text.length < 8 || text.startsWith("/")) return [];
  const saved = [];
  for (const p of PATTERNS) {
    const m = text.match(p.re);
    if (!m) continue;
    try {
      const value = p.extract(m);
      if (!value || value.length < 2) continue;
      // Pour "aime"/"deteste", on suffixe avec un index temps pour permettre plusieurs entrées
      const key =
        p.key === "aime" || p.key === "deteste"
          ? `${p.key}:${value.toLowerCase().slice(0, 24)}`
          : p.key;
      saveMemory(userJid, key, value);
      saved.push(key);
    } catch (err) {
      logger.warn({ err: err?.message }, "extractor failed on pattern");
    }
  }
  if (saved.length) {
    logger.info({ userJid, saved }, "🧠 infos auto-extraites");
  }
  return saved;
}
