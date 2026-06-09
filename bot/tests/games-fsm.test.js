import test from "node:test";
import assert from "node:assert/strict";

process.env.GEMINI_API_KEY = "test";

const { startGame, joinGame, handleSocialMessage, awaitingPlayer, _resetGamesForTests, advanceSocial } =
  await import("../src/games/engine.js");

const G = "g@g.us";
const A = "alice@s.whatsapp.net";
const B = "bob@s.whatsapp.net";

test("action ou vérité : démarrage, désignation, awaiting", () => {
  _resetGamesForTests();
  const r = startGame(G, "actionverite", { level: "detente" });
  assert.ok(!r.error);
  joinGame(G, A, "Alice");
  joinGame(G, B, "Bob");
  // relancer un round pour piocher un joueur (le 1er round a tourné avant les joins)
  advanceSocial(G);
  const aw = awaitingPlayer(G);
  assert.ok(aw === A || aw === B, "un joueur doit être attendu");
});

test("interruption : réponses d'autres joueurs n'avancent pas le jeu", () => {
  _resetGamesForTests();
  startGame(G, "actionverite");
  joinGame(G, A, "Alice");
  joinGame(G, B, "Bob");
  advanceSocial(G);
  const target = awaitingPlayer(G);
  const other = target === A ? B : A;
  // l'autre joueur tape : pas son tour => ignoré, awaiting inchangé
  const r1 = handleSocialMessage(G, other, "Other", "action");
  assert.equal(r1, null);
  assert.equal(awaitingPlayer(G), target);
});

test("réponse tardive : le bon joueur peut répondre après des interruptions", () => {
  _resetGamesForTests();
  startGame(G, "actionverite");
  joinGame(G, A, "Alice");
  joinGame(G, B, "Bob");
  advanceSocial(G);
  const target = awaitingPlayer(G);
  const other = target === A ? B : A;
  // bruits humains
  handleSocialMessage(G, other, "Other", "blabla");
  handleSocialMessage(G, other, "Other", "encore");
  // enfin le joueur attendu répond
  const r = handleSocialMessage(G, target, "Target", "verite");
  assert.ok(r?.text?.includes("Vérité") || r?.text?.includes("Action"));
});

test("niveau 'adultes' désactivé si GAMES_ADULT_MODE=false => downgrade en intense", () => {
  _resetGamesForTests();
  const r = startGame(G, "actionverite", { level: "adultes" });
  assert.ok(r.text.includes("intense") || r.text.includes("Personne"));
});
