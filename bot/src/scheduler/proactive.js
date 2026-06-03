import cron from "node-cron";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { stats } from "../dashboard/state.js";
import { pickRandom } from "../utils/text.js";
import { lastMessageTs } from "../db/repo.js";
import { QUESTIONS_DU_JOUR, RELANCES_SILENCE } from "../persona/canned.js";

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

function canSend() {
  if (!config.proactive.enabled) return false;
  const d = dayKey();
  if (stats.proactiveDay !== d) {
    stats.proactiveDay = d;
    stats.proactiveSentToday = 0;
  }
  return stats.proactiveSentToday < config.proactive.maxPerDay;
}

async function send(sock, jid, text) {
  if (!canSend()) {
    logger.info("⏸ proactive: quota atteint");
    return false;
  }
  await sock.sendMessage(jid, { text });
  stats.proactiveSentToday += 1;
  stats.scheduledRunCount += 1;
  return true;
}

export function startProactive({ sock, getGroupJid, tz }) {
  // Question du jour : 10h
  cron.schedule(
    "0 10 * * *",
    async () => {
      const jid = getGroupJid();
      if (!jid) return;
      await send(sock, jid, pickRandom(QUESTIONS_DU_JOUR));
    },
    { timezone: tz },
  );

  // Relance si silence
  cron.schedule(
    "15 10-23 * * *",
    async () => {
      const jid = getGroupJid();
      if (!jid) return;
      const last = lastMessageTs(jid);
      if (!last) return;
      const minutes = (Date.now() - last) / 60000;
      if (minutes >= config.silenceMinutes) {
        await send(sock, jid, pickRandom(RELANCES_SILENCE));
      }
    },
    { timezone: tz },
  );
}
