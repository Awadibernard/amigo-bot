import {
  default as makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import pino from "pino";
import { logger } from "../logger.js";
import { handleMessage } from "../handlers/message.js";
import { stats } from "../dashboard/state.js";

const AUTH_DIR = "auth_session";

/**
 * Connecte le bot à WhatsApp et appelle onReady(sock) à chaque (re)connexion stable.
 */
export async function startWhatsApp(onReady) {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "warn" }), // Baileys est très verbeux par défaut
    browser: ["Ayumi", "Chrome", "1.0"],
    markOnlineOnConnect: false,
    syncFullHistory: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      logger.info("Scanne ce QR avec WhatsApp (Appareils liés) :");
      qrcode.generate(qr, { small: true });
    }
    if (connection === "open") {
      stats.whatsappConnected = true;
      stats.botJid = sock.user?.id || "";
      logger.info({ user: sock.user?.id }, "WhatsApp connecté");
      onReady?.(sock);
    }
    if (connection === "close") {
      stats.whatsappConnected = false;
      const code =
        lastDisconnect?.error?.output?.statusCode ||
        lastDisconnect?.error?.output?.payload?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      logger.warn({ code, loggedOut }, "WhatsApp déconnecté");
      if (!loggedOut) {
        setTimeout(() => startWhatsApp(onReady), 3000);
      } else {
        logger.error("Session révoquée — supprime auth_session/ et relance pour rescanner.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      try {
        const ctx = buildContext(sock, msg);
        if (ctx) await handleMessage(ctx);
      } catch (err) {
        logger.error({ err }, "handleMessage failed");
      }
    }
  });

  return sock;
}

function buildContext(sock, msg) {
  if (!msg.message) return null;
  const remoteJid = msg.key.remoteJid || "";
  const isGroup = remoteJid.endsWith("@g.us");
  const groupJid = isGroup ? remoteJid : null;
  const userJid = isGroup ? msg.key.participant || "" : remoteJid;
  const isFromBot = !!msg.key.fromMe;
  const botJid = sock.user?.id?.replace(/:\d+@/, "@") || sock.user?.id || "";

  // Texte
  const m = msg.message;
  const text =
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    "";

  // Mentions / réponse
  const ctxInfo = m.extendedTextMessage?.contextInfo;
  const mentioned = ctxInfo?.mentionedJid || [];
  const quotedJid = ctxInfo?.participant || null;
  const quotedStanzaId = ctxInfo?.stanzaId || null;

  return {
    sock,
    msg,
    text,
    userJid,
    groupJid,
    pushName: msg.pushName || "",
    isFromBot,
    botJid,
    mentioned,
    quotedJid,
    quotedStanzaId,
  };
}
