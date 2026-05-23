import { config } from "../config.js";

const buckets = new Map(); // jid -> [timestamps]

export function isFlood(userJid) {
  const now = Date.now();
  const cutoff = now - config.flood.windowMs;
  const arr = (buckets.get(userJid) || []).filter((t) => t > cutoff);
  arr.push(now);
  buckets.set(userJid, arr);
  return arr.length > config.flood.maxMessages;
}
