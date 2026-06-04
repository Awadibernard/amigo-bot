// Test d'intégration léger du handleMessage : stub global fetch pour Gemini.
import test from "node:test";
import assert from "node:assert/strict";

process.env.GEMINI_API_KEY = "test";
process.env.CONVERSATIONAL_MODE = "true";
process.env.DEBUG_CONVERSATION = "true";
process.env.BLOCK_LINKS = "false";

// Stub global fetch — toutes les requêtes Gemini renvoient une réponse OK.
globalThis.fetch = async (url, opts) => {
  const body = opts?.body ? JSON.parse(opts.body) : {};
  const lastUserText =
    body.contents?.filter((c) => c.role === "user").slice(-1)[0]?.parts?.[0]
      ?.text || "ok";
  return {
    ok: true,
    status: 200,
    async json() {
      return {
        candidates: [
          {
            content: { parts: [{ text: "Réponse test: " + lastUserText.slice(0, 30) }] },
            finishReason: "STOP",
          },
        ],
      };
    },
    async text() {
      return "";
    },
  };
};

const { handleMessage } = await import("../src/handlers/message.js");
const { getDebug } = await import("../src/dashboard/state.js");
const { _resetDedupeForTests } = await import("../src/utils/dedupe.js");
const { hasSession, closeSession } = await import("../src/sessions/index.js");

const BOT = "bot@s.whatsapp.net";
const G = "grp@g.us";
const U = "user1@s.whatsapp.net";

function makeCtx(text, { mention = false, reply = false, id = "m" + Math.random() } = {}) {
  const sent = [];
  const sock = {
    sendMessage: async (jid, payload) => {
      sent.push({ jid, payload });
      return { key: { id: "bot-" + Math.random() } };
    },
  };
  return {
    sock,
    msg: {
      key: { id, fromMe: false, remoteJid: G, participant: U },
      message: { conversation: text },
    },
    text,
    userJid: U,
    groupJid: G,
    pushName: "Bob",
    isFromBot: false,
    botJid: BOT,
    mentioned: mention ? [BOT] : [],
    quotedJid: reply ? BOT : null,
    _sent: sent,
  };
}

test("message sans trigger → ignoré (no-trigger)", async () => {
  _resetDedupeForTests();
  closeSession(G, U);
  await handleMessage(makeCtx("salut tout le monde"));
  const last = getDebug().at(-1);
  assert.equal(last.decision, "IGNORED");
  assert.equal(last.reason, "no-trigger");
});

test("mention → traité par IA, ouvre session", async () => {
  _resetDedupeForTests();
  closeSession(G, U);
  await handleMessage(makeCtx("hey ça va ?", { mention: true }));
  const last = getDebug().at(-1);
  assert.equal(last.decision, "AI");
  assert.equal(hasSession(G, U), true);
});

test("message suivant en session traité sans mention", async () => {
  _resetDedupeForTests();
  closeSession(G, U);
  await handleMessage(makeCtx("ayumi tu es là ?"));
  assert.equal(hasSession(G, U), true);
  await handleMessage(makeCtx("oui je suis là"));
  const last = getDebug().at(-1);
  assert.equal(last.decision, "AI");
  assert.equal(last.reason, "session");
});

test("reply à Ayumi → traité même hors session", async () => {
  _resetDedupeForTests();
  closeSession(G, U);
  await handleMessage(makeCtx("merci !", { reply: true }));
  const last = getDebug().at(-1);
  assert.equal(last.decision, "AI");
  assert.equal(last.reason, "reply");
});

test("même msg.key.id deux fois → dédupliqué", async () => {
  _resetDedupeForTests();
  closeSession(G, U);
  const id = "fixed-id-1";
  await handleMessage(makeCtx("ayumi salut", { id }));
  const before = getDebug().length;
  await handleMessage(makeCtx("ayumi salut", { id }));
  const last = getDebug().at(-1);
  assert.equal(getDebug().length, before + 1);
  assert.equal(last.reason, "dedupe");
});
