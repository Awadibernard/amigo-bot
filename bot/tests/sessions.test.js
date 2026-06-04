import test from "node:test";
import assert from "node:assert/strict";

process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test";
process.env.CONVERSATIONAL_MODE = "true";

const { openSession, hasSession, closeSession, touchSession, getSession } =
  await import("../src/sessions/index.js");

test("ouvre et détecte une session", () => {
  openSession("g@g.us", "u@s.whatsapp.net");
  assert.equal(hasSession("g@g.us", "u@s.whatsapp.net"), true);
});

test("session indépendante par user", () => {
  openSession("g@g.us", "u1@s.whatsapp.net");
  assert.equal(hasSession("g@g.us", "u2@s.whatsapp.net"), false);
});

test("close session", () => {
  openSession("g@g.us", "u@s.whatsapp.net");
  closeSession("g@g.us", "u@s.whatsapp.net");
  assert.equal(hasSession("g@g.us", "u@s.whatsapp.net"), false);
});

test("touch session prolonge l'expiration", async () => {
  openSession("g@g.us", "u3@s.whatsapp.net");
  const s1 = getSession("g@g.us", "u3@s.whatsapp.net");
  const e1 = s1.expiresAt;
  await new Promise((r) => setTimeout(r, 10));
  touchSession("g@g.us", "u3@s.whatsapp.net");
  const s2 = getSession("g@g.us", "u3@s.whatsapp.net");
  assert.ok(s2.expiresAt > e1);
});
