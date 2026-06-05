// ============================================================
// MOTEUR DE JEUX
// - Jeux classiques (quiz/devinette…) : scoring via checkAnswer.
// - Jeux sociaux (actionverite, jenaijamais, debat…) : pas de
//   bonne réponse, on avance avec advanceSocial() / /next.
// ============================================================
import { addScore } from "../memory/index.js";
import { logger } from "../logger.js";

import quiz from "./types/quiz.js";
import devinette from "./types/devinette.js";
import vraifaux from "./types/vraifaux.js";
import motmystere from "./types/motmystere.js";
import culture from "./types/culture.js";
import quisuisje from "./types/quisuisje.js";
import blindtext from "./types/blindtext.js";
import actionverite from "./types/actionverite.js";
import roleplay from "./types/roleplay.js";
import jenaijamais from "./types/jenaijamais.js";
import preferestu from "./types/preferestu.js";
import pireque from "./types/pireque.js";
import defidujour from "./types/defidujour.js";
import questionrapide from "./types/questionrapide.js";
import debat from "./types/debat.js";
import { getCustomGame, listCustomGames } from "./registry.js";

export const TYPES = {
  // Sociaux (prioritaires pour le groupe ado)
  actionverite,
  jenaijamais,
  preferestu,
  pireque,
  defidujour,
  questionrapide,
  debat,
  // Classiques (scoring)
  quiz,
  devinette,
  vraifaux,
  motmystere,
  culture,
  quisuisje,
  blindtext,
  roleplay,
};

const ANSWER_TIMEOUT_MS = 90_000;
const SOCIAL_TURN_TIMEOUT_MS = 5 * 60_000;
const sessions = new Map();

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
export function listGameTypes() {
  return [...Object.keys(TYPES), ...listCustomGames().map((g) => "custom:" + g.id)];
}
export function isSocialGame(groupJid) {
  const s = sessions.get(groupJid);
  return !!(s && s.mod && s.mod.social);
}

export function startGame(groupJid, typeRaw, { totalRounds } = {}) {
  if (sessions.has(groupJid)) {
    return { error: "🎮 Une partie est déjà en cours. /stop pour l'arrêter." };
  }
  let mod, kind = "builtin", id = typeRaw;
  if (typeRaw.startsWith("custom:")) {
    const cg = getCustomGame(typeRaw.slice(7));
    if (!cg) return { error: `Jeu custom introuvable : ${typeRaw}` };
    mod = buildCustomModule(cg);
    kind = "custom";
    id = typeRaw;
  } else {
    mod = TYPES[typeRaw];
    if (!mod) {
      return {
        error: `Type inconnu. Essaie : ${Object.keys(TYPES).join(", ")}`,
      };
    }
  }

  const state = {
    type: id,
    kind,
    name: mod.name,
    points: mod.points || 0,
    totalRounds: totalRounds || mod.totalRounds || 5,
    round: 0,
    players: new Map(),
    used: new Set(),
    history: [],
    current: null,
    startedAt: Date.now(),
    timer: null,
    lastPlayerJid: null,
    mod,
  };
  sessions.set(groupJid, state);
  return { text: openRound(state) };
}

function openRound(state) {
  state.round += 1;
  const round = state.mod.nextRound(state);
  state.current = { ...(state.current || {}), ...round };
  if (state.timer) clearTimeout(state.timer);
  const ttl = state.mod.social ? SOCIAL_TURN_TIMEOUT_MS : ANSWER_TIMEOUT_MS;
  state.timer = setTimeout(() => endRound(state, null), ttl);
  if (state.mod.social) {
    return round.prompt;
  }
  const head = `🎮 *${state.name}* — manche ${state.round}/${state.totalRounds}`;
  const tail = "_90s pour répondre. /stop pour annuler, /score pour le classement._";
  return `${head}\n\n${round.prompt}\n\n${tail}`;
}

function endRound(state, winner) {
  if (state.timer) clearTimeout(state.timer);
  state.history.push({ round: state.round, winner });
  if (!state.mod.social && state.round >= state.totalRounds) return null;
  return openRound(state);
}

export function joinGame(groupJid, userJid, name) {
  const s = sessions.get(groupJid);
  if (!s) return false;
  if (!s.players.has(userJid)) {
    s.players.set(userJid, { jid: userJid, name: name || "?", score: 0 });
  }
  return true;
}

export function gameScore(groupJid) {
  const s = sessions.get(groupJid);
  if (!s) return null;
  return [...s.players.values()]
    .map((p) => ({ jid: p.jid, name: p.name, score: p.score }))
    .sort((a, b) => b.score - a.score);
}

// ===== Jeux sociaux =====
export function advanceSocial(groupJid) {
  const s = sessions.get(groupJid);
  if (!s || !s.mod.social) return null;
  return openRound(s);
}

export function handleSocialMessage(groupJid, userJid, name, text) {
  const s = sessions.get(groupJid);
  if (!s || !s.mod.social) return null;
  // toujours enregistrer le joueur qui interagit
  if (!s.players.has(userJid)) {
    s.players.set(userJid, { jid: userJid, name: name || "?", score: 0 });
  } else if (name) {
    s.players.get(userJid).name = name;
  }
  if (typeof s.mod.handleSocial !== "function") return null;
  return s.mod.handleSocial(s, userJid, name, text);
}

// ===== Jeux à scoring =====
export function tryAnswer(groupJid, userJid, displayName, text) {
  const s = sessions.get(groupJid);
  if (!s) return null;
  if (s.mod.social) return null; // pas pour les jeux sociaux
  if (!text) return null;
  const guess = normalize(text);
  if (!guess) return null;

  const res = s.mod.checkAnswer(s, guess, text);
  if (!res || !res.correct) return { correct: false };

  if (!s.players.has(userJid)) {
    s.players.set(userJid, { jid: userJid, name: displayName || "?", score: 0 });
  }
  const p = s.players.get(userJid);
  p.score += s.points;
  p.name = displayName || p.name;
  addScore(userJid, displayName, { points: s.points, wins: 1, played: 1 });

  const reply = `✅ Bonne réponse, ${displayName || "champion"} ! +${s.points} pts`;
  const next = endRound(s, userJid);
  if (next) return { correct: true, text: reply + "\n\n" + next };
  const ranking = gameScore(groupJid)
    .slice(0, 5)
    .map((r, i) => `${["🥇", "🥈", "🥉"][i] || i + 1 + "."} ${r.name} — ${r.score} pts`)
    .join("\n");
  sessions.delete(groupJid);
  return {
    correct: true,
    text: `${reply}\n\n🏁 *Fin de partie !* \n${ranking || "Personne n'a marqué."}`,
  };
}

export function stopGame(groupJid) {
  const s = sessions.get(groupJid);
  if (!s) return false;
  if (s.timer) clearTimeout(s.timer);
  sessions.delete(groupJid);
  return true;
}

function buildCustomModule(spec) {
  return {
    name: spec.name,
    totalRounds: Math.min(spec.rounds.length, 10),
    points: 2,
    nextRound(state) {
      const remaining = spec.rounds.filter((_, i) => !state.used.has(i));
      const idx = spec.rounds.indexOf(
        remaining[Math.floor(Math.random() * remaining.length)],
      );
      state.used.add(idx);
      const r = spec.rounds[idx];
      return { prompt: `❓ ${r.question}`, answers: r.answers, _idx: idx };
    },
    checkAnswer(state, guess) {
      const cur = state.current;
      if (!cur) return null;
      const win = (cur.answers || []).some((a) => normalize(a) === guess);
      return { correct: win };
    },
  };
}

export { normalize as _normalize };
