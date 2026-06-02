// Proxy de compatibilité — la vraie personnalité vit dans src/ai/personality.js
export { buildSystemPrompt, FEW_SHOTS } from "../ai/personality.js";
import { buildSystemPrompt } from "../ai/personality.js";
export const SYSTEM_PROMPT = buildSystemPrompt();
