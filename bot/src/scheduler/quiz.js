import cron from "node-cron";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { stats } from "../dashboard/state.js";
import { startGame } from "../games/engine.js";

export function startQuizAuto({ sock, getGroupJid, tz }) {
  if (!config.scheduler.quizAuto) return;
  // Vendredi 18h
  cron.schedule(
    "0 18 * * 5",
    async () => {
      const jid = getGroupJid();
      if (!jid) return;
      if (stats.quizAutoSentToday >= config.scheduler.maxQuizAutoPerWeek) return;
      const r = startGame(jid, "quiz");
      if (r.text) {
        await sock.sendMessage(jid, {
          text: "🎉 C'est vendredi ! Un petit quiz pour la soirée :\n\n" + r.text,
        });
        stats.quizAutoSentToday += 1;
        stats.scheduledRunCount += 1;
        logger.info("🎮 quiz auto lancé");
      }
    },
    { timezone: tz },
  );
}
