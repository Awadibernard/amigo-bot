import test from "node:test";
import assert from "node:assert/strict";
import { extractAndStore } from "../src/memory/extractor.js";
import { listMemories, clearMemories } from "../src/memory/index.js";

process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test";

const U = "extractor-test@s.whatsapp.net";

test("détecte un anniversaire", () => {
  clearMemories(U);
  const saved = extractAndStore({
    text: "mon anniversaire est le 12/07",
    userJid: U,
  });
  assert.ok(saved.includes("anniversaire"));
  const list = listMemories(U, 10);
  assert.ok(list.find((m) => m.key === "anniversaire"));
});

test("détecte un métier", () => {
  clearMemories(U);
  extractAndStore({ text: "je suis développeur depuis 5 ans", userJid: U });
  const list = listMemories(U, 10);
  assert.ok(list.find((m) => m.key === "metier"));
});

test("ignore les messages trop courts", () => {
  clearMemories(U);
  const r = extractAndStore({ text: "ok", userJid: U });
  assert.equal(r.length, 0);
});
