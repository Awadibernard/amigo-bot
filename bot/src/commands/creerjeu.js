// /creerjeu <thème> — Ayumi génère un jeu custom via l'IA
// L'IA renvoie un JSON strict que l'on valide avant de stocker.
import { askAyumi } from "../ai/gemini.js";
import { saveCustomGame, validateGameSpec, listCustomGames, deleteCustomGame } from "../games/registry.js";

const SYSTEM = `Tu génères des jeux pour un bot WhatsApp. Réponds UNIQUEMENT un JSON valide, sans markdown, sans texte autour. Schéma :
{"id":"slug","name":"Nom court","rules":"Règles brèves","rounds":[{"question":"...","answers":["réponse1","variante2"]}, ...]}
Contraintes : id en minuscules a-z0-9_- (2-32), 4 à 8 rounds, 1 à 5 answers par round, questions < 200 chars, réponses < 60 chars, en français.`;

function extractJson(text) {
  if (!text) return null;
  // enlever d'éventuels fences markdown
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // chercher le 1er bloc { ... }
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

export async function creerjeu({ args, userJid }) {
  const theme = args.join(" ").trim();
  if (!theme || theme === "list") {
    const list = listCustomGames();
    if (!list.length) return "Aucun jeu custom. Usage : /creerjeu <thème>";
    return ["🧩 *Jeux custom :*", ...list.map((g) => `• ${g.id} — ${g.name} (${g.rounds} rounds)`)].join("\n");
  }
  if (args[0] === "delete" && args[1]) {
    return deleteCustomGame(args[1]) ? `🗑️ Jeu ${args[1]} supprimé.` : `Aucun jeu ${args[1]}.`;
  }

  const reply = await askAyumi({
    userJid,
    userMessage: `Crée un mini-jeu sur le thème : ${theme}`,
    systemExtras: SYSTEM,
    isInternal: true,
    bypassQuota: true,
    historyOverride: [],
  });
  const spec = extractJson(reply);
  if (!spec) return `❌ Impossible de générer un JSON valide. Réessaie.\n\nRéponse brute :\n${(reply || "").slice(0, 300)}`;
  const err = validateGameSpec(spec);
  if (err) return `❌ Jeu invalide : ${err}`;
  const r = saveCustomGame(spec);
  if (r.error) return `❌ ${r.error}`;
  return `✅ Jeu créé : *${spec.name}* (id: ${spec.id}, ${spec.rounds.length} rounds)\nLance-le avec /jeu custom:${spec.id}`;
}
