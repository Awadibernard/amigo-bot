import { help } from "./help.js";
import { ayumi } from "./ayumi.js";
import { warn } from "./warn.js";
import { warns } from "./warns.js";
import { clearwarns } from "./clearwarns.js";
import { stats } from "./stats.js";
import { ping } from "./ping.js";
import { del } from "./del.js";
import { poll } from "./poll.js";
import { kick } from "./kick.js";
import { promote, demote } from "./promote.js";
import { tagall } from "./tagall.js";
import {
  jeu,
  quiz,
  devinette,
  vraifaux,
  motmystere,
  culture,
  quisuisje,
  blindtext,
  actionverite,
  roleplay,
  jenaijamais,
  preferestu,
  pireque,
  defidujour,
  questionrapide,
  debat,
  stop,
  next as nextCmd,
  jouer,
  score,
} from "./jeu.js";
import { classement } from "./classement.js";
import { remember, memories, forget } from "./remember.js";
import { creerjeu } from "./creerjeu.js";

export const commands = {
  help,
  ayumi,
  warn,
  warns,
  clearwarns,
  stats,
  ping,
  del,
  delete: del,
  poll,
  sondage: poll,
  kick,
  ban: kick,
  promote,
  demote,
  tagall,
  everyone: tagall,

  // Jeux
  jeu,
  jeux: jeu,
  quiz,
  devinette,
  vraifaux,
  motmystere,
  culture,
  quisuisje,
  qsj: quisuisje,
  blindtext,
  blind: blindtext,
  actionverite,
  av: actionverite,
  roleplay,
  rp: roleplay,
  stop,
  jouer,
  join: jouer,
  score,
  classement,
  leaderboard: classement,
  creerjeu,
  newgame: creerjeu,

  // Mémoire
  remember,
  retiens: remember,
  memories,
  souvenirs: memories,
  forget,
  oublie: forget,
};

export function parseCommand(text = "") {
  const t = text.trim();
  if (!t.startsWith("/")) return null;
  const [head, ...rest] = t.slice(1).split(/\s+/);
  return { name: head.toLowerCase(), args: rest };
}
