import test from "node:test";
import assert from "node:assert/strict";

const { recordMessage, inHumanThread, lastBotQuestionAt, _resetThreadsForTests } =
  await import("../src/addressing/threads.js");

const BOT = "bot@s.whatsapp.net";
const G = "g@g.us";
const A = "a@s.whatsapp.net";
const B = "b@s.whatsapp.net";

test("inHumanThread détecte échange entre humains", () => {
  _resetThreadsForTests();
  recordMessage(G, { userJid: A, text: "salut B" });
  recordMessage(G, { userJid: B, text: "salut A" });
  assert.equal(inHumanThread(G, A, BOT), true);
});

test("lastBotQuestionAt détecte question récente", () => {
  _resetThreadsForTests();
  recordMessage(G, { userJid: BOT, text: "Ça va ?", fromBot: true });
  assert.ok(lastBotQuestionAt(G, BOT) > 0);
});

test("lastBotQuestionAt ignore affirmations", () => {
  _resetThreadsForTests();
  recordMessage(G, { userJid: BOT, text: "Salut.", fromBot: true });
  assert.equal(lastBotQuestionAt(G, BOT), 0);
});

test("normalisation JID dans threads", () => {
  _resetThreadsForTests();
  recordMessage(G, { userJid: "user:5@s.whatsapp.net", text: "hi" });
  // pas d'assertion forte, vérifie juste pas de crash
  assert.ok(true);
});
