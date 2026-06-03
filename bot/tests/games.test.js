import test from "node:test";
import assert from "node:assert/strict";

// Force un DB path isolé pour les tests
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test";

import { validateGameSpec } from "../src/games/registry.js";

test("validateGameSpec accepte un spec correct", () => {
  const ok = validateGameSpec({
    id: "demo",
    name: "Démo",
    rules: "x",
    rounds: [
      { question: "Q1 ?", answers: ["a"] },
      { question: "Q2 ?", answers: ["b", "B"] },
    ],
  });
  assert.equal(ok, null);
});

test("validateGameSpec rejette un id invalide", () => {
  const err = validateGameSpec({
    id: "BAD ID!",
    name: "x",
    rounds: [
      { question: "q", answers: ["a"] },
      { question: "q", answers: ["a"] },
    ],
  });
  assert.match(err, /id/i);
});

test("validateGameSpec rejette trop peu de rounds", () => {
  const err = validateGameSpec({
    id: "demo",
    name: "x",
    rounds: [{ question: "q", answers: ["a"] }],
  });
  assert.match(err, /rounds/i);
});
