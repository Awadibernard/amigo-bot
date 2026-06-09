import test from "node:test";
import assert from "node:assert/strict";

process.env.CONVERSATIONAL_MODE = "true";
process.env.GEMINI_API_KEY = "test";

const { resolveAddressee } = await import("../src/addressing/resolver.js");
const { recordMessage, _resetThreadsForTests } = await import("../src/addressing/threads.js");
const { openSession, closeSession } = await import("../src/sessions/index.js");

const BOT = "bot@s.whatsapp.net";
const G = "g@g.us";
const U1 = "kevin@s.whatsapp.net";
const U2 = "bernard@s.whatsapp.net";

function reset() {
  _resetThreadsForTests();
  closeSession(G, U1);
  closeSession(G, U2);
}

test("mention => ayumi, certitude", () => {
  reset();
  const d = resolveAddressee({ text: "hey ayumi", userJid: U1, groupJid: G, botJid: BOT, mentioned: [BOT] });
  assert.equal(d.target, "ayumi");
  assert.equal(d.confidence, 1);
});

test("reply à Ayumi => ayumi", () => {
  reset();
  const d = resolveAddressee({ text: "merci !", userJid: U1, groupJid: G, botJid: BOT, quotedJid: BOT });
  assert.equal(d.target, "ayumi");
  assert.equal(d.reason, "reply");
});

test("scénario du brief : 'Oui incroyable' destiné à un humain", () => {
  reset();
  // Ayumi : Salut.
  recordMessage(G, { userJid: BOT, text: "Salut.", fromBot: true });
  // Bernard : Ça va ?
  recordMessage(G, { userJid: U2, text: "Ça va ?" });
  // Ayumi : Oui.
  recordMessage(G, { userJid: BOT, text: "Oui.", fromBot: true });
  // Kevin : Tu as vu le match ?
  recordMessage(G, { userJid: U1, text: "Tu as vu le match ?" });
  // Bernard répond — destiné à Kevin, pas à Ayumi
  const d = resolveAddressee({
    text: "Oui incroyable",
    userJid: U2,
    groupJid: G,
    botJid: BOT,
  });
  assert.notEqual(d.target, "ayumi");
});

test("session active sans question récente => ayumi confiance moyenne", () => {
  reset();
  openSession(G, U1, { ayumiAsked: false });
  const d = resolveAddressee({ text: "ok cool", userJid: U1, groupJid: G, botJid: BOT });
  assert.equal(d.target, "ayumi");
});

test("aucun signal => other", () => {
  reset();
  const d = resolveAddressee({ text: "salut tout le monde", userJid: U1, groupJid: G, botJid: BOT });
  assert.equal(d.target, "other");
});

test("trigger nom 'ayumi' dans le texte => ayumi", () => {
  reset();
  const d = resolveAddressee({ text: "tiens ayumi tu en penses quoi ?", userJid: U1, groupJid: G, botJid: BOT });
  assert.equal(d.target, "ayumi");
});
