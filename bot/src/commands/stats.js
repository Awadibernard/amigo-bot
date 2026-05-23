import { groupStats } from "../db/repo.js";
import { jidToNumber } from "../utils/text.js";

export async function stats({ groupJid }) {
  const s = groupStats(groupJid);
  const top = s.top
    .map((r, i) => `${i + 1}. ${r.display_name || jidToNumber(r.jid)} — ${r.n}`)
    .join("\n") || "(personne)";
  return [
    `*Stats du groupe*`,
    `Messages enregistrés : ${s.total}`,
    `Sur 24h : ${s.last24}`,
    ``,
    `Top 3 (24h) :`,
    top,
  ].join("\n");
}
