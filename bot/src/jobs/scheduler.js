import cron from "node-cron";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { lastMessageTs } from "../db/repo.js";
import { pickRandom } from "../utils/text.js";
import { QUESTIONS_DU_JOUR, DEBATS, RELANCES_SILENCE } from "../persona/canned.js";

export function startScheduler(sock, getGroupJid) {
  const tz = config.tz;

  // Question du jour : 10h
  cron.schedule(
    "0 10 * * *",
    async () => {
      const jid = getGroupJid();
      if (!jid) return;
      await sock.sendMessage(jid, { text: pickRandom(QUESTIONS_DU_JOUR) });
    },
    { timezone: tz },
  );

  // Débat du soir : 21h, ~50% du temps
  cron.schedule(
    "0 21 * * *",
    async () => {
      const jid = getGroupJid();
      if (!jid) return;
      if (Math.random() < 0.5) {
        await sock.sendMessage(jid, { text: pickRandom(DEBATS) });
      }
    },
    { timezone: tz },
  );

  // Relance si silence : check toutes les heures (10h-23h)
  cron.schedule(
    "15 10-23 * * *",
    async () => {
      const jid = getGroupJid();
      if (!jid) return;
      const last = lastMessageTs(jid);
      if (!last) return;
      const minutes = (Date.now() - last) / 60000;
      if (minutes >= config.silenceMinutes) {
        await sock.sendMessage(jid, { text: pickRandom(RELANCES_SILENCE) });
      }
    },
    { timezone: tz },
  );

  logger.info({ tz }, "Scheduler started");
}
