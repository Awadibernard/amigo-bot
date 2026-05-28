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

export const commands = {
  help,
  ayumi,
  warn,
  warns,
  clearwarns,
  stats,
  ping,
  del,
  delete: del, // alias
  poll,
  sondage: poll, // alias FR
  kick,
  ban: kick, // alias
  promote,
  demote,
  tagall,
  everyone: tagall, // alias
};

/**
 * Parse "/cmd args..." -> { name, args } ou null
 */
export function parseCommand(text = "") {
  const t = text.trim();
  if (!t.startsWith("/")) return null;
  const [head, ...rest] = t.slice(1).split(/\s+/);
  return { name: head.toLowerCase(), args: rest };
}
