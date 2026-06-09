import test from "node:test";
import assert from "node:assert/strict";
import { validateResponse } from "../src/games/validator.js";

test("vide => empty", () => {
  assert.equal(validateResponse("").kind, "empty");
  assert.equal(validateResponse("   ").kind, "empty");
});
test("spam => spam", () => {
  assert.equal(validateResponse("aaaaaaaa").kind, "spam");
  assert.equal(validateResponse("zzzzzzzzz").kind, "spam");
});
test("troll court => troll", () => {
  assert.equal(validateResponse("tg").kind, "troll");
  assert.equal(validateResponse("ntm").kind, "troll");
});
test("phrase courte => weak ok", () => {
  const r = validateResponse("oui");
  assert.equal(r.ok, true);
  assert.equal(r.kind, "weak");
});
test("phrase valide => valid", () => {
  const r = validateResponse("J'ai menti à mon père pour sortir hier soir.");
  assert.equal(r.ok, true);
  assert.equal(r.kind, "valid");
});
