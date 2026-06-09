import test from "node:test";
import assert from "node:assert/strict";
import { validateGameSpec } from "../src/games/registry.js";

test("valide une spec correcte", () => {
  const spec = {
    id: "pirates",
    name: "Pirates",
    rules: "Trouve la réponse",
    rounds: [
      { question: "Quel est le nom du bateau de Jack Sparrow ?", answers: ["black pearl"] },
      { question: "Capitale des pirates des Caraïbes ?", answers: ["tortuga"] },
    ],
  };
  assert.equal(validateGameSpec(spec), null);
});

test("rejette si id invalide", () => {
  const r = validateGameSpec({
    id: "Bad Id !!",
    name: "X",
    rounds: [{ question: "q?", answers: ["a"] }, { question: "q2?", answers: ["b"] }],
  });
  assert.match(r, /id invalide/);
});

test("rejette si rounds manquent", () => {
  const r = validateGameSpec({ id: "ok", name: "X", rounds: [] });
  assert.match(r, /rounds/);
});

test("rejette si answers vides", () => {
  const r = validateGameSpec({
    id: "ok",
    name: "X",
    rounds: [{ question: "q?", answers: [] }, { question: "q?", answers: ["a"] }],
  });
  assert.match(r, /answers/);
});

test("rejette si spec absente", () => {
  assert.match(validateGameSpec(null), /spec/);
});
