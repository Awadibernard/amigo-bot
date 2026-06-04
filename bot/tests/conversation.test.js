// Test d'intégration léger du handleMessage : on stub askAyumi et le sock.
import test from "node:test";
import assert from "node:assert/strict";

process.env.GEMINI_API_KEY = "test";
process.env.CONVERSATIONAL_MODE = "true";
process.env.DEBUG_CONVERSATION = "true";
process.env.BLOCK_LINKS = "false";

// Stub Gemini AVANT import handler
const gemini = await import("../src/ai/gemini.js");
gemini.askAyumi = async ({ userMessage }) => "Réponse test: " + userMessage.slice(0, 20);

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
    msg: { key: { id, fromMe: false, remoteJid: G, participant: U }, message: { conversation: text } },
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

test("message sans trigger → ignoré avec raison no-trigger", async () => {
  _resetDedupeForTests();
  closeSession(G, U);
  const ctx = makeCtx("salut tout le monde");
  await handleMessage(ctx);
  const last = getDebug().at(-1);
  assert.equal(last.decision, "IGNORED");
  assert.equal(last.reason, "no-trigger");
});

test("mention → traité par IA, ouvre session", async () => {
  _resetDedupeForTests();
  closeSession(G, U);
  const ctx = makeCtx("hey @ayumi ça va ?", { mention: true });
  await handleMessage(ctx);
  const last = getDebug().at(-1);
  assert.equal(last.decision, "AI");
  assert.equal(hasSession(G, U), true);
});

test("message suivant en session est traité sans mention", async () => {
  _resetDedupeForTests();
  closeSession(G, U);
  await handleMessage(makeCtx("ayumi tu es là ?"));
  assert.equal(hasSession(G, U), true);
  const ctx2 = makeCtx("oui je suis là");
  await handleMessage(ctx2);
  const last = getDebug().at(-1);
  assert.equal(last.decision, "AI");
  assert.equal(last.reason, "session");
});

test("reply à Ayumi → traité même hors session", async () => {
  _resetDedupeForTests();
  closeSession(G, U);
  const ctx = makeCtx("merci !", { reply: true });
  await handleMessage(ctx);
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
