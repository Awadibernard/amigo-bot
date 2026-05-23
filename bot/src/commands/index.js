import { help } from "./help.js";
import { ayumi } from "./ayumi.js";
import { warn } from "./warn.js";
import { stats } from "./stats.js";
import { ping } from "./ping.js";

export const commands = { help, ayumi, warn, stats, ping };

/**
 * Parse "/cmd args..." -> { name, args } ou null
 */
export function parseCommand(text = "") {
  const t = text.trim();
  if (!t.startsWith("/")) return null;
  const [head, ...rest] = t.slice(1).split(/\s+/);
  return { name: head.toLowerCase(), args: rest };
}
