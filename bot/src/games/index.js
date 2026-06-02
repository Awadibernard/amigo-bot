// ============================================================
// MOTEUR DE JEUX D'AYUMI
// ------------------------------------------------------------
// Gère les sessions de jeu actives par groupe (en mémoire) +
// délègue le scoring à la table leaderboard (src/memory).
// ============================================================
import { QUIZ, DEVINETTES, VRAI_FAUX, MOTS_MYSTERES } from "./data.js";
import { addScore } from "../memory/index.js";
import { pickRandom } from "../utils/text.js";

export const GAME_TYPES = {
  quiz: { name: "Quiz culture G", pool: QUIZ, points: 2 },
  devinette: { name: "Devinette", pool: DEVINETTES, points: 3 },
  vraifaux: { name: "Vrai ou Faux", pool: VRAI_FAUX, points: 1 },
  motmystere: { name: "Mot mystère", pool: MOTS_MYSTERES, points: 2 },
};

// Sessions actives : Map<groupJid, session>
const sessions = new Map();

const ANSWER_TIMEOUT_MS = 60_000; // 60s pour répondre

function normalize(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .trim();
}

export function hasActiveGame(groupJid) {
  return sessions.has(groupJid);
}

export function activeGame(groupJid) {
  return sessions.get(groupJid) || null;
}

export function activeGamesCount() {
  return sessions.size;
}

/**
 * Démarre une partie. Renvoie le texte de la 1re question.
 */
export function startGame(groupJid, type) {
  const def = GAME_TYPES[type];
  if (!def) return { error: `Type inconnu. Essaie : ${Object.keys(GAME_TYPES).join(", ")}` };
  if (sessions.has(groupJid)) {
    return { error: "🎮 Une partie est déjà en cours. Tape /stop pour l'arrêter." };
  }

  const question = pickRandom(def.pool);
  const session = {
    type,
    name: def.name,
    points: def.points,
    question,
    startedAt: Date.now(),
    timer: setTimeout(() => sessions.delete(groupJid), ANSWER_TIMEOUT_MS),
  };
  sessions.set(groupJid, session);
  return {
    text: `🎮 *${def.name}*\n\n❓ ${question.q}\n\n_Tu as 60s pour répondre. /stop pour annuler._`,
  };
}

/**
 * Tente de valider une réponse. Renvoie {correct, text} ou null si pas de partie.
 */
export function tryAnswer(groupJid, userJid, displayName, text) {
  const s = sessions.get(groupJid);
  if (!s) return null;

  const guess = normalize(text);
  if (!guess) return null;

  const win = s.question.a.some((acc) => normalize(acc) === guess);
  if (!win) return { correct: false };

  clearTimeout(s.timer);
  sessions.delete(groupJid);
  addScore(userJid, displayName, { points: s.points, wins: 1, played: 1 });
  return {
    correct: true,
    text: `✅ Bonne réponse, ${displayName || "champion"} ! +${s.points} pts 🏆`,
  };
}

export function stopGame(groupJid) {
  const s = sessions.get(groupJid);
  if (!s) return false;
  clearTimeout(s.timer);
  sessions.delete(groupJid);
  return true;
}
