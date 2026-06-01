import "./db/index.js"; // initialise la DB au boot
import { logger } from "./logger.js";
import { config } from "./config.js";
import { runtime } from "./runtime.js";
import { startWhatsApp } from "./core/whatsapp.js";
import { startScheduler } from "./jobs/scheduler.js";
import { kvGet, kvSet } from "./db/repo.js";
import { startDashboard } from "./dashboard/server.js";

// Filet de sécurité GLOBAL : le bot ne doit jamais crasher
process.on("unhandledRejection", (err) =>
  logger.error({ err: err?.message, stack: err?.stack }, "unhandledRejection"),
);
process.on("uncaughtException", (err) =>
  logger.error({ err: err?.message, stack: err?.stack }, "uncaughtException"),
);

startDashboard();

let activeGroupJid = config.groupJid || kvGet("active_group_jid") || "";
function getGroupJid() {
  return config.groupJid || activeGroupJid;
}

async function main() {
  logger.info("🚀 Démarrage Ayumi…");
  logger.info(
    {
      testMode: config.testMode,
      adminEnforce: runtime.adminEnforce,
      admins: config.adminNumbers.length
        ? config.adminNumbers
        : "(aucun — ADMIN_NUMBERS vide)",
      model: config.gemini.model,
      blockLinks: config.moderation.blockLinks,
      blockMedia: config.moderation.blockMedia,
      deleteBlocked: config.moderation.deleteBlocked,
    },
    "⚙️  Configuration",
  );

  await startWhatsApp((sock) => {
    sock.ev.on("messages.upsert", ({ messages }) => {
      if (config.groupJid) return;
      for (const m of messages) {
        const jid = m.key.remoteJid;
        if (jid?.endsWith("@g.us") && jid !== activeGroupJid) {
          activeGroupJid = jid;
          kvSet("active_group_jid", jid);
          logger.info({ groupJid: jid }, "Groupe actif détecté (mémorisé)");
        }
      }
    });
    startScheduler(sock, getGroupJid);
  });
}

main().catch((err) =>
  logger.error({ err: err?.message, stack: err?.stack }, "Fatal au démarrage"),
);
