import cron from "node-cron";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { db } from "../db/index.js";

// Anniversaires : on cherche la clé "anniversaire" dans la table memories.
// Format accepté : "12/07", "12-07", "12/07/1995", "12 juillet".
function parseDay(s) {
  if (!s) return null;
  const m = s.match(/^(\d{1,2})[\/\-\s](\d{1,2})/);
  if (m) return { d: +m[1], m: +m[2] };
  const months = {
    janvier: 1, fevrier: 2, février: 2, mars: 3, avril: 4, mai: 5,
    juin: 6, juillet: 7, aout: 8, août: 8, septembre: 9, octobre: 10,
    novembre: 11, decembre: 12, décembre: 12,
  };
  const m2 = s.toLowerCase().match(/^(\d{1,2})\s+([a-zéûôîâ]+)/);
  if (m2 && months[m2[2]]) return { d: +m2[1], m: months[m2[2]] };
  return null;
}

export function startBirthdays({ sock, getGroupJid, tz }) {
  if (!config.scheduler.birthdaysAuto) return;
  // Check à 9h tous les jours
  cron.schedule(
    "0 9 * * *",
    async () => {
      const jid = getGroupJid();
      if (!jid) return;
      try {
        const rows = db
          .prepare(
            `SELECT m.user_jid, m.value, u.display_name
             FROM memories m LEFT JOIN users u ON u.jid = m.user_jid
             WHERE m.key = 'anniversaire'`,
          )
          .all();
        const today = new Date();
        const d = today.getDate(), mo = today.getMonth() + 1;
        for (const r of rows) {
          const p = parseDay(r.value);
          if (p && p.d === d && p.m === mo) {
            const name = r.display_name || r.user_jid.split("@")[0];
            await sock.sendMessage(jid, {
              text: `🎂 Joyeux anniversaire ${name} ! 🎉🎈`,
              mentions: [r.user_jid],
            });
            logger.info({ user: r.user_jid }, "🎂 anniversaire envoyé");
          }
        }
      } catch (err) {
        logger.warn({ err: err?.message }, "birthdays job failed");
      }
    },
    { timezone: tz },
  );
}
