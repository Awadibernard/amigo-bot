# Ayumi — Bot WhatsApp communautaire (MVP)

Bot Node.js minimaliste pour un petit groupe WhatsApp privé entre amis.
Stack : **Node.js 20 + Baileys + SQLite + OpenRouter + node-cron + pino**.

## Fonctionnalités MVP

- Connexion WhatsApp via Baileys (QR + reconnexion auto + session persistée)
- Modération scriptée : anti-liens, anti-flood, blacklist, warnings
- IA légère (OpenRouter) **uniquement** sur `/ayumi`, mention du bot, ou réponse à un de ses messages
- Persona "Ayumi" : ton fun, léger sarcasme, communautaire
- Tâches cron : question du jour, débat aléatoire, relance si silence
- Commandes : `/help`, `/ayumi`, `/warn`, `/stats`, `/ping`

## Lancement local

```bash
cd bot
cp .env.example .env       # remplir OPENROUTER_API_KEY
npm install
npm start
```

Au premier lancement, un **QR code** s'affiche dans le terminal. Scanner avec
WhatsApp (Appareils liés). La session est persistée dans `auth_session/`.

Pour limiter le bot à un seul groupe :
1. Lancer le bot, l'ajouter au groupe, envoyer un message dedans.
2. Lire le `groupJid` dans les logs.
3. Mettre cette valeur dans `GROUP_JID` du `.env` et redémarrer.

## Déploiement Railway

1. Push ce dossier `bot/` dans un repo GitHub dédié (ou utiliser Railway CLI).
2. Sur Railway : **New Project → Deploy from GitHub repo**.
3. Variables d'environnement à définir (onglet *Variables*) :
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_MODEL` (optionnel)
   - `GROUP_JID`
   - `ADMIN_NUMBERS`
   - `TZ=Europe/Paris`
4. Ajouter un **Volume** monté sur `/app/auth_session` et `/app/data`
   (sinon la session WhatsApp et la DB sont perdues à chaque redéploiement).
5. Start command : `npm start` (auto-détecté).
6. Premier déploiement : ouvrir les **logs**, scanner le QR code affiché.

> Railway gratuit suffit pour un petit groupe (le bot dort peu, prévoir
> ~512 Mo RAM). Si Railway coupe l'instance pour inactivité, Baileys
> reconnectera automatiquement au réveil.

## Structure

```
bot/
├── src/
│   ├── index.js              # entrée
│   ├── config.js             # env + constantes
│   ├── logger.js             # pino
│   ├── core/
│   │   └── whatsapp.js       # connexion Baileys + dispatcher
│   ├── db/
│   │   ├── index.js          # better-sqlite3 + schema
│   │   └── repo.js           # helpers users/messages/warnings/kv
│   ├── handlers/
│   │   └── message.js        # routeur principal d'un message entrant
│   ├── moderation/
│   │   ├── antilink.js
│   │   ├── antiflood.js
│   │   ├── blacklist.js
│   │   └── warnings.js
│   ├── commands/
│   │   ├── index.js          # registre des commandes
│   │   ├── help.js
│   │   ├── ayumi.js
│   │   ├── warn.js
│   │   ├── stats.js
│   │   └── ping.js
│   ├── ai/
│   │   └── openrouter.js     # appel API + rate-limit basique
│   ├── persona/
│   │   ├── prompt.js         # system prompt Ayumi
│   │   └── canned.js         # réponses pré-scriptées
│   ├── jobs/
│   │   └── scheduler.js      # cron: question du jour, débat, relance
│   └── utils/
│       └── text.js
├── data/                     # SQLite (créé au premier run)
└── auth_session/             # session Baileys (créé au premier run)
```
