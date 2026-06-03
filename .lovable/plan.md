## Refonte Ayumi — Assistant communautaire autonome

Refonte structurée du bot WhatsApp en 10 chantiers. Travail concentré dans `bot/src/` uniquement (le frontend Lovable n'est pas touché).

### 1. Réponses IA stables et complètes (`bot/src/ai/`)
- `gemini.js` : passer `maxOutputTokens` de 256 → **2048**, timeout 25s → **45s**.
- Détecter `finishReason === "MAX_TOKENS"` → marquer `truncated:true` dans `stats`.
- Logger taille prompt (chars + nb messages) et taille réponse.
- Nouveau `bot/src/utils/chunk.js` : `splitForWhatsApp(text, 3500)` qui découpe sur paragraphes/phrases.
- `handlers/message.js` et `commands/ayumi.js` : envoi multi-messages quand réponse > 3500 chars (petit délai entre chunks).

### 2. Mémoire avancée (`bot/src/memory/`)
- Nouvelle table `summaries(group_jid, text, covers_until_ts, ts)`.
- `summarizer.js` : tous les **50 messages** d'un groupe, appelle Gemini en mode "résume en 5 puces" et stocke. Garde uniquement le dernier résumé actif + 5 archives.
- `context.js` : nouveau builder `buildAiContext({groupJid, userJid})` qui assemble :
  - mémoire user (`memories`)
  - faits groupe (`facts`)
  - dernier résumé (`summaries`)
  - N derniers messages bruts
- `gemini.js` consomme ce builder à la place du contexte ad-hoc actuel.

### 3. Détection auto d'infos importantes (`bot/src/memory/extractor.js`)
- Regex légères pour patterns évidents : "mon anniv(ersaire) est…", "j'aime …", "je suis (dev|prof|étudiant|…)", "j'habite …", "mon prénom est …".
- Pour les cas ambigus : appel Gemini **léger** (1×/utilisateur/heure max, prompt court demandant JSON `{facts:[{key,value}]}`).
- Stocké via `saveMemory()` existant, source taggée `auto`.
- Pas d'appel sur messages < 15 chars, commandes, ou messages bot.

### 4. Sessions de discussion (`bot/src/sessions/index.js`)
- `Map<groupJid, {userJid, expiresAt, lastQuestionFromAyumi:boolean}>`.
- Ouverte quand : user mentionne/répond à Ayumi, ou Ayumi pose une question (détection `?` final).
- TTL **3 min**, reset à chaque échange.
- Dans `handlers/message.js` : si session active pour ce user, traiter le message comme adressé à Ayumi sans trigger explicite.
- Flag global `CONVERSATIONAL_MODE` dans `.env` pour désactiver complètement.

### 5. Moteur de jeux refondu (`bot/src/games/`)
- `engine.js` : machine à états par groupe avec `{type, players:Map, scores, round, totalRounds, usedQuestions:Set, turn, history, expiresAt}`.
- Modules par jeu dans `bot/src/games/types/` :
  - `quiz.js`, `devinette.js`, `motmystere.js`, `vraifaux.js` (existants, refondus)
  - `actionverite.js`, `quisuisje.js`, `blindtext.js`, `culture.js`, `roleplay.js` (nouveaux)
- Chaque module expose `{ name, minPlayers, totalRounds, nextRound(state, ai?), checkAnswer(state, userJid, text) }`.
- Commandes `/jeu <type>`, `/jouer` (rejoindre), `/score`, `/stop`. Le scoring va dans `leaderboard`.

### 6. Plugin de jeux dynamiques (`bot/src/games/registry.js` + `bot/data/custom_games.json`)
- Schéma JSON strict (validé via une fonction `validateGameSpec`) : `{id, name, rules, rounds:[{question, answers:[], hints:[]}]}`.
- Commande `/creerjeu <thème>` : appelle Gemini avec un prompt qui force ce JSON, parse, valide, stocke. Aucune exécution de code.
- Les jeux custom sont jouables via `/jeu custom:<id>`.

### 7. Scheduler autonome (`bot/src/scheduler/`)
- Refonte de `bot/src/jobs/scheduler.js` → dossier dédié avec :
  - `proactive.js` : relance après silence (existant, durci)
  - `quiz.js` : quiz auto si `QUIZ_AUTO=true` (vendredi 20h existant + planning configurable)
  - `debate.js` : propose un sujet de débat 1×/semaine
  - `birthdays.js` : check journalier sur `memories` clé `anniversaire`, envoie un message dans le groupe
- Compteurs quotidiens par type, limites via `.env` : `MAX_QUIZ_AUTO_PER_WEEK`, `MAX_DEBAT_AUTO_PER_WEEK`, `MAX_PROACTIVE_MESSAGES_PER_DAY`.

### 8. Dashboard enrichi (`bot/src/dashboard/`)
- `state.js` : ajout compteurs (résumés stockés, sessions actives, réponses tronquées, taille moyenne contexte, dernières erreurs IA détaillées avec stack tronquée).
- `server.js` : endpoints `/api/memory`, `/api/sessions`, `/api/games`, `/api/scheduler`, `/api/errors` + page HTML enrichie (toujours sans dépendance externe).

### 9. Réorganisation
- Création des dossiers `bot/src/sessions/`, `bot/src/scheduler/`.
- `bot/src/games/` éclaté en `engine.js` + `types/`.
- Doc `bot/README.md` mise à jour avec l'architecture.

### 10. Tests de validation (`bot/tests/`)
- Runner natif Node `node --test`.
- Couvre : mémoire (save/list/search), engine de jeux (quiz complet, scoring), context builder (assemblage), chunker WhatsApp (découpe propre), session manager (TTL, ouverture/fermeture).
- Script `npm test` dans `bot/package.json`.

### Détails techniques
- Aucune nouvelle dépendance npm (utilise `node-cron` déjà présent, `better-sqlite3` déjà présent, `fetch` natif pour Gemini).
- Toutes les variables ajoutées sont documentées dans `bot/.env.example` avec valeurs par défaut sûres.
- Aucune modification du frontend Lovable (`src/`).
- Migrations SQLite idempotentes (CREATE TABLE IF NOT EXISTS) dans `memory/index.js`.
