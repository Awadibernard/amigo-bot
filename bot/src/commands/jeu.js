import {
  TYPES,
  startGame,
  stopGame,
  activeGame,
  gameScore,
  joinGame,
  listGameTypes,
  advanceSocial,
  isSocialGame,
} from "../games/engine.js";
import { listCustomGames } from "../games/registry.js";

const HELP = () =>
  [
    "🎮 *Jeux sociaux* (recommandés) :",
    "• /jeu actionverite — Action ou Vérité tour par tour",
    "• /jeu jenaijamais — Je n'ai jamais",
    "• /jeu preferestu — Préfères-tu",
    "• /jeu pireque — Qui est le plus susceptible",
    "• /jeu defidujour — Défi du jour",
    "• /jeu questionrapide — Questions rapides",
    "• /jeu debat — Lancer un débat",
    "",
    "🧠 *Jeux à scoring* :",
    "• /jeu quiz, /jeu devinette, /jeu vraifaux, /jeu motmystere, /jeu culture, /jeu quisuisje, /jeu blindtext, /jeu roleplay",
    ...listCustomGames().map((g) => `• /jeu custom:${g.id} — ${g.name}`),
    "",
    "• /jouer  — rejoindre la partie",
    "• /next   — passer au tour suivant (jeux sociaux)",
    "• /score  — classement (jeux à scoring)",
    "• /stop   — arrêter",
  ].join("\n");

export async function jeu({ args, groupJid }) {
  const sub = (args[0] || "").toLowerCase();
  if (!sub || sub === "help" || sub === "list") return HELP();
  if (sub === "stop")
    return stopGame(groupJid) ? "🛑 Partie arrêtée." : "Aucune partie en cours.";
  if (sub === "next") {
    if (!isSocialGame(groupJid)) return "Pas de jeu social en cours.";
    const t = advanceSocial(groupJid);
    return t || "Impossible d'avancer.";
  }
  if (sub === "status") {
    const s = activeGame(groupJid);
    return s
      ? `🎮 ${s.name} — manche ${s.round}${s.mod?.social ? "" : "/" + s.totalRounds}\n${s.current?.prompt || ""}`
      : "Aucune partie.";
  }
  if (sub === "custom" && args[1]) {
    const r = startGame(groupJid, "custom:" + args[1]);
    return r.error || r.text;
  }
  if (sub.startsWith("custom:")) {
    const r = startGame(groupJid, sub);
    return r.error || r.text;
  }
  if (TYPES[sub]) {
    const r = startGame(groupJid, sub);
    return r.error || r.text;
  }
  return `Type inconnu. Essaie : ${listGameTypes().join(", ")}`;
}

const make = (type) => async ({ groupJid }) => {
  const r = startGame(groupJid, type);
  return r.error || r.text;
};

export const quiz = make("quiz");
export const devinette = make("devinette");
export const vraifaux = make("vraifaux");
export const motmystere = make("motmystere");
export const culture = make("culture");
export const quisuisje = make("quisuisje");
export const blindtext = make("blindtext");
export const actionverite = make("actionverite");
export const roleplay = make("roleplay");
export const jenaijamais = make("jenaijamais");
export const preferestu = make("preferestu");
export const pireque = make("pireque");
export const defidujour = make("defidujour");
export const questionrapide = make("questionrapide");
export const debat = make("debat");

export async function stop({ groupJid }) {
  return stopGame(groupJid) ? "🛑 Partie arrêtée." : "Aucune partie en cours.";
}

export async function next({ groupJid }) {
  if (!isSocialGame(groupJid)) return "Pas de jeu social en cours. /jeu actionverite pour démarrer.";
  const t = advanceSocial(groupJid);
  return t || "Impossible d'avancer.";
}

export async function jouer({ groupJid, userJid, pushName }) {
  return joinGame(groupJid, userJid, pushName)
    ? `🙋 ${pushName || "Toi"} rejoint la partie !`
    : "Aucune partie en cours. Lance /jeu actionverite par exemple.";
}

export async function score({ groupJid }) {
  const s = gameScore(groupJid);
  if (!s) return "Aucune partie en cours.";
  if (!s.length) return "📊 Personne n'a encore marqué.";
  const medals = ["🥇", "🥈", "🥉"];
  return [
    "📊 *Score actuel*",
    ...s.map((p, i) => `${medals[i] || i + 1 + "."} ${p.name} — ${p.score} pts`),
  ].join("\n");
}
