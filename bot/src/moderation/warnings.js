import { addWarning, countWarnings } from "../db/repo.js";
import { config } from "../config.js";

export function warnUser(jid, reason) {
  const total = addWarning(jid, reason);
  const overLimit = total >= config.warnings.maxBeforeNotice;
  return { total, overLimit };
}

export function getWarnings(jid) {
  return countWarnings(jid);
}
