import test from "node:test";
import assert from "node:assert/strict";
import { alreadyProcessed, _resetDedupeForTests } from "../src/utils/dedupe.js";

test("dédup détecte un id déjà vu", () => {
  _resetDedupeForTests();
  assert.equal(alreadyProcessed("a"), false);
  assert.equal(alreadyProcessed("a"), true);
  assert.equal(alreadyProcessed("b"), false);
});

test("dédup ignore id vide", () => {
  _resetDedupeForTests();
  assert.equal(alreadyProcessed(""), false);
  assert.equal(alreadyProcessed(null), false);
});
