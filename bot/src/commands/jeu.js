import { GAME_TYPES, startGame, stopGame, activeGame } from "../games/index.js";

const HELP = [
  "🎮 *Jeux disponibles :*",
  "• /quiz          — culture générale",
  "• /devinette     — énigmes",
  "• /vraifaux      — vrai ou faux",
  "• /motmystere    — devine le mot",
  "• /stop          — arrêter la partie",
  "• /classement    — top joueurs",
].join("\n");

export async function jeu({ args, groupJid }) {
  const sub = (args[0] || "").toLowerCase();
  if (!sub || sub === "help") return HELP;
  if (sub === "stop") {
    return stopGame(groupJid)
      ? "🛑 Partie arrêtée."
      : "Aucune partie en cours.";
  }
  if (sub === "status") {
    const s = activeGame(groupJid);
    return s ? `🎮 En cours : ${s.name}\n❓ ${s.question.q}` : "Aucune partie.";
  }
  if (GAME_TYPES[sub]) {
    const r = startGame(groupJid, sub);
    return r.error || r.text;
  }
  return HELP;
}

export async function quiz({ groupJid }) {
  const r = startGame(groupJid, "quiz");
  return r.error || r.text;
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
export async function stop({ groupJid }) {
  return stopGame(groupJid) ? "🛑 Partie arrêtée." : "Aucune partie en cours.";
}
