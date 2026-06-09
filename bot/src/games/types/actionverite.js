// ============================================================
// ACTION OU VÉRITÉ — jeu social tour par tour, avec NIVEAUX.
// - Désigne explicitement le joueur (mention).
// - awaiting = joueur attendu. Tant qu'il n'a pas répondu un
//   message VALIDE, le jeu n'avance pas (tolère interruptions).
// - /next pour passer (ou auto-passage après réponse valide).
// ============================================================
import { pickRandom } from "../../utils/text.js";
import { getLevel } from "../data/actionverite/index.js";
import { validateResponse } from "../validator.js";
import { config } from "../../config.js";

export default {
  name: "Action ou Vérité",
  social: true,
  totalRounds: 99,
  points: 0,
  init(state, opts = {}) {
    const requested = (opts.level || "detente").toLowerCase();
    if (requested === "adultes" && !config.games?.adultMode) {
      state.level = "intense";
      state._levelDowngraded = true;
    } else {
      state.level = requested;
    }
  },
  nextRound(state) {
    const players = [...state.players.values()];
    if (!players.length) {
      state.current = { waiting: true };
      state.awaiting = null;
      return {
        prompt:
          "Personne n'a rejoint la partie 🙃\nTapez */jouer* pour participer, puis */next* pour démarrer.",
      };
    }
    const prev = state.lastPlayerJid;
    const pool = players.filter((p) => p.jid !== prev);
    const chosen = pickRandom(pool.length ? pool : players);
    state.current = {
      targetJid: chosen.jid,
      targetName: chosen.name,
      phase: "choice",
      level: state.level,
    };
    state.lastPlayerJid = chosen.jid;
    state.awaiting = {
      playerJid: chosen.jid,
      kind: "choice",
      since: Date.now(),
    };
    const banner = state._levelDowngraded
      ? "_(niveau ‘adultes’ désactivé : on reste en ‘intense’)_\n"
      : "";
    state._levelDowngraded = false;
    return {
      prompt:
        `${banner}🎲 *${chosen.name}*, Action ou Vérité ? _(niveau ${state.level})_\n` +
        "_Réponds *action* ou *vérité*. /next pour passer ton tour._",
      mentions: [chosen.jid],
    };
  },
  handleSocial(state, userJid, name, text) {
    const cur = state.current;
    if (!cur || cur.waiting) return null;
    if (cur.targetJid && userJid !== cur.targetJid) return null; // pas son tour

    const t = String(text).toLowerCase().trim();
    const lvl = getLevel(state.level);

    if (cur.phase === "choice") {
      if (/^(action|a)\b/.test(t)) {
        cur.phase = "challenge";
        cur.kind = "action";
        state.awaiting = {
          playerJid: cur.targetJid,
          kind: "action-response",
          since: Date.now(),
        };
        return {
          text:
            `🎯 Action pour *${cur.targetName}* :\n${pickRandom(lvl.action)}\n\n` +
            "_Réponds quand t'as fait. /next pour passer au suivant._",
        };
      }
      if (/^(verit[ée]|v)\b/.test(t)) {
        cur.phase = "challenge";
        cur.kind = "verite";
        state.awaiting = {
          playerJid: cur.targetJid,
          kind: "verite-response",
          since: Date.now(),
        };
        return {
          text:
            `🔮 Vérité pour *${cur.targetName}* :\n${pickRandom(lvl.verite)}\n\n` +
            "_Réponds honnêtement. /next pour passer au suivant._",
        };
      }
      return null;
    }

    if (cur.phase === "challenge") {
      const v = validateResponse(text, { minChars: cur.kind === "action" ? 1 : 3 });
      if (!v.ok) {
        // ne pas avancer ; renvoyer un rappel léger seulement si spam/troll
        if (v.kind === "troll") {
          return { text: `Hey ${name || cur.targetName}, joue le jeu 🙂` };
        }
        return null;
      }
      // réponse valide → libère le slot, n'avance pas auto (laisse /next)
      state.awaiting = null;
      cur.phase = "answered";
      return { text: `✅ Bien joué *${name || cur.targetName}* ! _/next pour le tour suivant._` };
    }
    return null;
  },
  checkAnswer() {
    return { correct: false };
  },
};
