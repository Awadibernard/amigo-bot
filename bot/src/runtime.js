// État runtime mutable (modifiable via dashboard sans redémarrage)
import { config } from "./config.js";

export const runtime = {
  // Quand false → tout le monde peut utiliser les commandes admin
  // (utile en phase de test si la détection admin échoue).
  // Par défaut : true sauf si TEST_MODE=true.
  adminEnforce: !config.testMode,
};
