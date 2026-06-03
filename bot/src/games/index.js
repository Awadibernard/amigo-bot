// Compatibilité avec l'ancien import `../games/index.js`.
// Tout est délégué au nouveau moteur.
export {
  TYPES as GAME_TYPES,
  startGame,
  stopGame,
  activeGame,
  hasActiveGame,
  activeGamesCount,
  joinGame,
  gameScore,
  tryAnswer,
  listGameTypes,
} from "./engine.js";
