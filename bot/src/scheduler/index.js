// Scheduler central — branche tous les jobs autonomes d'Ayumi.
import cron from "node-cron";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { stats } from "../dashboard/state.js";
import { startProactive } from "./proactive.js";
import { startQuizAuto } from "./quiz.js";
import { startDebate } from "./debate.js";
import { startBirthdays } from "./birthdays.js";

export function startScheduler(sock, getGroupJid) {
  const tz = config.tz;
  startProactive({ sock, getGroupJid, tz });
  startQuizAuto({ sock, getGroupJid, tz });
  startDebate({ sock, getGroupJid, tz });
  startBirthdays({ sock, getGroupJid, tz });

  // Reset compteurs quotidiens à minuit
  cron.schedule(
    "0 0 * * *",
    () => {
      stats.proactiveSentToday = 0;
      stats.quizAutoSentToday = 0;
      stats.debateAutoSentToday = 0;
    },
    { timezone: tz },
  );

  logger.info(
    {
      tz,
      proactive: config.proactive.enabled,
      quizAuto: config.scheduler.quizAuto,
      debateAuto: config.scheduler.debateAuto,
      birthdays: config.scheduler.birthdaysAuto,
    },
    "🗓 Scheduler started",
  );
}
