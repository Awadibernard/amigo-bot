import test from "node:test";
import assert from "node:assert/strict";

process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test";

const { buildSystemPrompt } = await import("../src/ai/personality.js");
const { buildAiContext } = await import("../src/memory/context.js");
const { saveMemory, clearMemories } = await import("../src/memory/index.js");

test("system prompt contient la règle anti-récitation", () => {
  const p = buildSystemPrompt({ userName: "Bob" });
  assert.match(p, /RÉCITER|réciter|liste/);
  assert.match(p, /Bob/);
});

test("buildAiContext encapsule la mémoire dans des balises", () => {
  const uid = "test-user@s.whatsapp.net";
  clearMemories(uid);
  saveMemory(uid, "sport", "football");
  const { systemExtras } = buildAiContext({
    groupJid: "g@g.us",
    userJid: uid,
    botJid: "bot@s.whatsapp.net",
  });
  assert.match(systemExtras, /<USER_MEMORY>/);
  assert.match(systemExtras, /football/);
  assert.match(systemExtras, /JAMAIS lister/);
  clearMemories(uid);
});

test("buildAiContext sans mémoire → systemExtras vide", () => {
  const uid = "unknown-user@s.whatsapp.net";
  clearMemories(uid);
  const { systemExtras } = buildAiContext({
    groupJid: "empty@g.us",
    userJid: uid,
    botJid: "bot@s.whatsapp.net",
  });
  assert.equal(systemExtras, "");
});
