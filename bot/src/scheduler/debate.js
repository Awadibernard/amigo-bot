import cron from "node-cron";
import { config } from "../config.js";
import { stats } from "../dashboard/state.js";
import { pickRandom } from "../utils/text.js";
import { DEBATS } from "../persona/canned.js";

export function startDebate({ sock, getGroupJid, tz }) {
  if (!config.scheduler.debateAuto) return;
  // Dimanche 21h
  cron.schedule(
    "0 21 * * 0",
    async () => {
      const jid = getGroupJid();
      if (!jid) return;
      if (stats.debateAutoSentToday >= config.scheduler.maxDebateAutoPerWeek) return;
      await sock.sendMessage(jid, { text: "🔥 " + pickRandom(DEBATS) });
      stats.debateAutoSentToday += 1;
      stats.scheduledRunCount += 1;
    },
    { timezone: tz },
  );
}
