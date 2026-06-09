import test from "node:test";
import assert from "node:assert/strict";

process.env.STICKER_MODERATION = "true";
process.env.GEMINI_API_KEY = "test";

const { decideAction } = await import("../src/moderation/stickers.js");

test("safe verdict => keep", () => {
  const d = decideAction({ sexual: false, violence: false, safe: true, confidence: 0.95 });
  assert.equal(d.action, "keep");
});
test("sexual high conf => delete", () => {
  const d = decideAction({ sexual: true, violence: false, safe: false, confidence: 0.9 });
  assert.equal(d.action, "delete");
  assert.equal(d.reason, "nsfw");
});
test("violence high conf => delete", () => {
  const d = decideAction({ sexual: false, violence: true, safe: false, confidence: 0.95 });
  assert.equal(d.action, "delete");
  assert.equal(d.reason, "violence");
});
test("sexual mais conf basse => keep", () => {
  const d = decideAction({ sexual: true, violence: false, safe: false, confidence: 0.5 });
  assert.equal(d.action, "keep");
});
test("verdict skipped => keep", () => {
  const d = decideAction({ skipped: true, reason: "no-key" });
  assert.equal(d.action, "keep");
});
