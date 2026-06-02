import { topPlayers } from "../memory/index.js";
import { jidToNumber } from "../utils/text.js";

export async function classement() {
  const top = topPlayers(10);
  if (!top.length) return "🏆 Classement vide. Lance /quiz pour commencer !";
  const medals = ["🥇", "🥈", "🥉"];
  const lines = top.map((p, i) => {
    const tag = medals[i] || `${i + 1}.`;
    const name = p.display_name || jidToNumber(p.user_jid);
    return `${tag} ${name} — ${p.points} pts (${p.wins} victoires)`;
  });
  return ["🏆 *Classement Ayumi*", "", ...lines].join("\n");
}
