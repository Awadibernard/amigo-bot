# Phase Finale — Ayumi V3

Objectif : Ayumi devient un membre du groupe. Le **script est le cerveau logique**, Gemini est le **cerveau créatif** (génération de contenu uniquement, jamais de logique).

Aucune nouvelle fonctionnalité majeure hors de ce plan. Tout est testé avant validation.

---

## 1. Moteur de compréhension des destinataires (`addressing`)

Nouveau module `bot/src/addressing/resolver.js` qui produit pour chaque message :

```
{ target: "ayumi" | "other" | "game", confidence: 0..1, reason: "..." }
```

Cascade de décision (court-circuit dès qu'un niveau tranche) :

- **N1 — Certitude (100%)** : mention `@ayumi`, reply à un msg d'Ayumi, commande `/`, jeu en attente d'une réponse de ce joueur.
- **N2 — Contexte récent** : Ayumi a posé une question dans les 90s et ce user est le destinataire naturel (mention ou suite directe).
- **N3 — Conversations parallèles** : maintien d'un graphe de fils `bot/src/addressing/threads.js` (qui parle à qui, mention/reply chain, fenêtre 50 msgs). Si le message s'inscrit dans un fil humain↔humain → `other`.
- **N4 — Arbitrage IA** (uniquement si N1-N3 ambigus ET `confidence < 0.7`) : appel Gemini `classifyAddressee()` retournant JSON strict `{target, confidence, reason}`. Le script décide en dernier ressort (jamais d'override par Gemini sous seuil).

Garde-fou : par défaut `target=other` si aucun signal positif. **Jamais d'auto-attribution silencieuse à Ayumi.**

Intégration dans `handlers/message.js` : remplace l'actuelle détection trigger/session par un appel à `resolveAddressee(ctx)`. Le résultat alimente le debug buffer.

---

## 2. Moteur de jeux — refonte état/transitions

Nouveau `bot/src/games/state-machine.js` exposant une FSM commune :

```
WAITING_PLAYERS → START → PLAYER_SELECTION → QUESTION
  → WAITING_RESPONSE → VALIDATION → NEXT_PLAYER → END
```

Chaque session jeu enregistre :
- `awaiting`: `{ playerJid, kind, since, timeoutMs, history[] }`
- `pendingResponses`: file FIFO permettant qu'une **réponse arrive tardivement** (interruptions tolérées).
- `participants`, `lastPlayer`, `roundLog`.

**Règle clé interruptions** : tant que `awaiting.playerJid` n'a pas envoyé un message **classifié `target=game` par le validator**, le jeu ne consomme rien. Les messages humains↔humains intercalés sont ignorés par le jeu (mais loggés dans le fil social).

### Validation des réponses (`games/validator.js`)
Heuristiques pures (pas Gemini) :
- vide / < 2 caractères significatifs → `invalid:empty`
- répétition (`aaaaa`, même char >70%) → `invalid:spam`
- détection troll basique (insulte + très court) → `invalid:troll`
- sinon → `valid` (ou `weak` si <8 chars hors action/vérité courte)

### Action ou Vérité — niveaux
Refonte `games/types/actionverite.js` + nouvelles données `games/data/actionverite/{detente,social,intense,adultes}.js`.
- Param niveau : `/jeu actionverite [niveau]` (defaut `detente`).
- Niveau `adultes` requiert `GAMES_ADULT_MODE=true` (env) ET admin du groupe.
- Désignation explicite du joueur (mention), réaction légère après réponse, passage automatique au suivant via `/next` ou auto après validation.

### Autres jeux refondus sur la FSM
`jenaijamais`, `preferestu` (compteur + détection hésitation = mini débat), `pireque` (vote collectif, anti-doublon), `debat` (animatrice : sujet → ouverture → args → contre-args → synthèse), `questionrapide`, `defidujour`. Tous **sociaux**, sans scoring, gérés par la FSM.

---

## 3. Système universel `/creerjeu <thème>`

Refonte `commands/creerjeu.js` + `games/registry.js` :
- Appelle Gemini avec **schéma JSON strict** (Output schema) :
  ```
  { titre, description, regles[], etapes[], questions[] }
  ```
- Stocké en DB (`custom_games`). **Aucun code généré, aucune eval**. Le moteur convertit les données en session FSM standard (type `custom`).
- Validation Zod côté script. Refus si champs manquants.

---

## 4. Gestion des interruptions

Implémentée via §2 :
- `awaiting` persiste tant que timeout non atteint (5 min par défaut, configurable).
- Messages d'autres joueurs : enregistrés dans `threads`, ignorés par la FSM.
- Le joueur attendu peut répondre 3 messages plus tard : le matcher rapproche son prochain message valide à `awaiting`.
- `/next`, `/skip`, ou timeout libèrent le slot.

---

## 5. Modération des stickers (pipeline indépendant)

Nouveau `bot/src/moderation/stickers.js` :
- Téléchargement sticker → conversion webp→png (sharp non dispo côté worker mais bot Node-only OK, garder `sharp` côté bot uniquement).
- Appel Gemini Vision (`gemini-2.5-flash`) avec prompt classification JSON strict :
  ```
  { sexual:bool, violence:bool, safe:bool, confidence:0..1 }
  ```
- **Jamais de description d'image**. Prompt explicite.
- Actions selon seuils env :
  - `STICKER_MODERATION=true`
  - `STICKER_NSFW_THRESHOLD=0.80`
  - `STICKER_VIOLENCE_THRESHOLD=0.80`
- Si dépasse : suppression + warn.

Intégré dans `handlers/message.js` AVANT le resolver addressee.

---

## 6. Dashboard — vue cerveau social

Ajouts à `bot/src/dashboard/server.js` + state :
- `/api/threads` : fils conversationnels actifs (qui parle à qui).
- `/api/games/active` : jeux en cours, `awaiting`, joueurs attendus, timeouts.
- `/api/addressing/last` : 50 dernières décisions du resolver avec `reason` + `confidence`.
- `/api/stickers/log` : dernières modérations stickers.
- UI : 4 nouvelles cartes (Threads, Jeux actifs, Décisions adressage, Stickers).

---

## 7. Tests

Nouveaux fichiers `bot/tests/` :
- `addressing.test.js` — 4 niveaux, cas Bernard/Kevin du brief, conversations parallèles.
- `games-fsm.test.js` — transitions, interruptions tardives, timeout.
- `games-validator.test.js` — vide, spam, troll, valide.
- `actionverite-levels.test.js` — niveaux + gating adultes.
- `creerjeu.test.js` — schéma Zod, refus si invalide (Gemini stubbé).
- `stickers.test.js` — pipeline classification (Vision stubbée).

Cible : **≥ 50 tests verts** avant validation.

---

## 8. Fichiers

**Créés** :
- `bot/src/addressing/{resolver,threads,classifier}.js`
- `bot/src/games/{state-machine,validator}.js`
- `bot/src/games/data/actionverite/{detente,social,intense,adultes}.js`
- `bot/src/moderation/stickers.js`
- Tests listés ci-dessus.

**Modifiés** :
- `bot/src/handlers/message.js` (pipeline stickers → addressing → game/AI)
- `bot/src/games/engine.js` (utilise FSM)
- `bot/src/games/types/*.js` (FSM-compliant)
- `bot/src/commands/creerjeu.js`, `commands/jeu.js`
- `bot/src/ai/gemini.js` (ajout `classifyAddressee`, `classifySticker`, `generateCustomGame`)
- `bot/src/dashboard/{server,state}.js`
- `bot/src/config.js`, `bot/.env.example`

**Non touché** : commandes admin, scheduler, mémoire (déjà stabilisée).

---

## 9. Critères de validation

1. `npm test` ≥ 50 verts.
2. Le cas du brief (Ayumi/Bernard/Kevin → "Oui incroyable") classé `target=other`.
3. Action ou Vérité supporte interruption : 2 messages off-topic puis réponse acceptée.
4. `/creerjeu pirates` produit un jeu jouable sans crash, sans code généré.
5. Sticker NSFW → supprimé + log dashboard.
6. Dashboard expose threads, jeux actifs, décisions, stickers.

---

## 10. Action utilisateur après livraison

Ajouter au `.env` :
```
GAMES_ADULT_MODE=false
STICKER_MODERATION=true
STICKER_NSFW_THRESHOLD=0.80
STICKER_VIOLENCE_THRESHOLD=0.80
ADDRESSING_AI_ARBITRATION=true
ADDRESSING_CONFIDENCE_THRESHOLD=0.7
```
Puis redémarrer le bot.
