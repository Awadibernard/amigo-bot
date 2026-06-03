import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

// DB isolée pour ce test
const DB = "data/test_memory.db";
try { fs.unlinkSync(DB); } catch {}
process.chdir(process.cwd()); // no-op
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test";

// On force un chemin temporaire en remplaçant le module db ne marche pas simplement.
// On utilise donc directement l'API memory et on nettoie après.
const { saveMemory, listMemories, deleteMemory, getUserContext } = await import(
  "../src/memory/index.js"
);

const TEST_USER = "test-user@s.whatsapp.net";

test("save + list memories", () => {
  // nettoyer d'éventuels résidus
  deleteMemory(TEST_USER, "sport");
  saveMemory(TEST_USER, "sport", "football");
  const list = listMemories(TEST_USER, 5);
  assert.ok(list.some((m) => m.key === "sport" && m.value === "football"));
});

test("getUserContext renvoie un texte non vide", () => {
  saveMemory(TEST_USER, "ville", "Lomé");
  const ctx = getUserContext(TEST_USER);
  assert.match(ctx, /ville/);
  assert.match(ctx, /Lomé/);
});

test("deleteMemory supprime bien", () => {
  saveMemory(TEST_USER, "tmp", "x");
  assert.equal(deleteMemory(TEST_USER, "tmp"), 1);
});
