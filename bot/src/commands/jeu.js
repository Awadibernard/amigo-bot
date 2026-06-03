import {
  TYPES,
  startGame,
  stopGame,
  activeGame,
  gameScore,
  joinGame,
  listGameTypes,
} from "../games/engine.js";
import { listCustomGames } from "../games/registry.js";

const HELP = () =>
  [
    "🎮 *Jeux disponibles* :",
    ...Object.entries(TYPES).map(([k, v]) => `• /jeu ${k.padEnd(12)} — ${v.name}`),
    ...listCustomGames().map((g) => `• /jeu custom:${g.id} — ${g.name} (custom)`),
    "",
    "• /jouer        — rejoindre la partie",
    "• /score        — classement de la partie",
    "• /stop         — arrêter",
    "• /creerjeu     — créer un jeu via l'IA",
  ].join("\n");

export async function jeu({ args, groupJid }) {
  const sub = (args[0] || "").toLowerCase();
  if (!sub || sub === "help") return HELP();
  if (sub === "stop") return stopGame(groupJid) ? "🛑 Partie arrêtée." : "Aucune partie en cours.";
  if (sub === "status") {
    const s = activeGame(groupJid);
    return s
      ? `🎮 ${s.name} — manche ${s.round}/${s.totalRounds}\n${s.current?.prompt || ""}`
      : "Aucune partie.";
  }
  if (sub === "list") return HELP();
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

export async function quiz({ groupJid }) {
  return (startGame(groupJid, "quiz").text) || startGame(groupJid, "quiz").error;
}
export async function devinette({ groupJid }) {
  const r = startGame(groupJid, "devinette");
  return r.error || r.text;
}
export async function vraifaux({ groupJid }) {
  const r = startGame(groupJid, "vraifaux");
  return r.error || r.text;
}
export async function motmystere({ groupJid }) {
  const r = startGame(groupJid, "motmystere");
  return r.error || r.text;
}
export async function culture({ groupJid }) {
  const r = startGame(groupJid, "culture");
  return r.error || r.text;
}
export async function quisuisje({ groupJid }) {
  const r = startGame(groupJid, "quisuisje");
  return r.error || r.text;
}
export async function blindtext({ groupJid }) {
  const r = startGame(groupJid, "blindtext");
  return r.error || r.text;
}
export async function actionverite({ groupJid }) {
  const r = startGame(groupJid, "actionverite");
  return r.error || r.text;
}
export async function roleplay({ groupJid }) {
  const r = startGame(groupJid, "roleplay");
  return r.error || r.text;
}

export async function stop({ groupJid }) {
  return stopGame(groupJid) ? "🛑 Partie arrêtée." : "Aucune partie en cours.";
}

export async function jouer({ groupJid, userJid, pushName }) {
  return joinGame(groupJid, userJid, pushName)
    ? `🙋 ${pushName || "Toi"} rejoint la partie !`
    : "Aucune partie en cours. Lance /jeu quiz par exemple.";
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
