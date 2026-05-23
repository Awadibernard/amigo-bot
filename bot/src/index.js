import "./db/index.js"; // initialise la DB au boot
import { logger } from "./logger.js";
import { config } from "./config.js";
import { startWhatsApp } from "./core/whatsapp.js";
import { startScheduler } from "./jobs/scheduler.js";
import { kvGet, kvSet } from "./db/repo.js";

let activeGroupJid = config.groupJid || kvGet("active_group_jid") || "";

function getGroupJid() {
  return config.groupJid || activeGroupJid;
}

async function main() {
  logger.info("Démarrage Ayumi...");

  await startWhatsApp((sock) => {
    // Première connexion réussie : on capture le groupe si non configuré.
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

process.on("unhandledRejection", (err) => logger.error({ err }, "unhandledRejection"));
process.on("uncaughtException", (err) => logger.error({ err }, "uncaughtException"));

main().catch((err) => {
  logger.error({ err }, "Fatal");
  process.exit(1);
});
