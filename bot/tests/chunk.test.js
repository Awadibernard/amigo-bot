import test from "node:test";
import assert from "node:assert/strict";
import { splitForWhatsApp } from "../src/utils/chunk.js";

test("texte court non découpé", () => {
  const out = splitForWhatsApp("salut");
  assert.deepEqual(out, ["salut"]);
});

test("découpe préfixée avec compteurs", () => {
  const long = "a".repeat(8000);
  const out = splitForWhatsApp(long, 3000);
  assert.ok(out.length >= 3);
  assert.match(out[0], /^\(1\//);
});

test("respect des paragraphes", () => {
  const text = "para1\n\n" + "x".repeat(2000) + "\n\n" + "y".repeat(2000);
  const out = splitForWhatsApp(text, 2200);
  assert.ok(out.length >= 2);
});
