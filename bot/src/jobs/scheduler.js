import cron from "node-cron";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { lastMessageTs } from "../db/repo.js";
import { pickRandom } from "../utils/text.js";
import {
  QUESTIONS_DU_JOUR,
  DEBATS,
  RELANCES_SILENCE,
} from "../persona/canned.js";
import { startGame } from "../games/index.js";
import { stats } from "../dashboard/state.js";

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

function canSendProactive() {
  if (!config.proactive.enabled) return false;
  const d = dayKey();
  if (stats.proactiveDay !== d) {
    stats.proactiveDay = d;
    stats.proactiveSentToday = 0;
  }
  return stats.proactiveSentToday < config.proactive.maxPerDay;
}

async function proactiveSend(sock, jid, text) {
  if (!canSendProactive()) {
    logger.info("⏸ Proactive : quota atteint pour aujourd'hui");
    return false;
  }
  await sock.sendMessage(jid, { text });
  stats.proactiveSentToday += 1;
  logger.info({ count: stats.proactiveSentToday }, "📣 Message proactif envoyé");
  return true;
}

export function startScheduler(sock, getGroupJid) {
  const tz = config.tz;

  // Question du jour : 10h
  cron.schedule(
    "0 10 * * *",
    async () => {
      const jid = getGroupJid();
      if (!jid) return;
      await proactiveSend(sock, jid, pickRandom(QUESTIONS_DU_JOUR));
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
        await proactiveSend(sock, jid, pickRandom(DEBATS));
      }
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
        await proactiveSend(sock, jid, pickRandom(RELANCES_SILENCE));
      }
    },
    { timezone: tz },
  );

  // Quiz auto du vendredi 18h
  if (config.games.autoFridayQuiz) {
    cron.schedule(
      "0 18 * * 5",
      async () => {
        const jid = getGroupJid();
        if (!jid) return;
        const r = startGame(jid, "quiz");
        if (r.text) {
          await sock.sendMessage(jid, {
            text: "🎉 C'est vendredi ! Un petit quiz pour bien démarrer la soirée :\n\n" + r.text,
          });
        }
      },
      { timezone: tz },
    );
  }

  logger.info({ tz, proactive: config.proactive.enabled }, "Scheduler started");
}
