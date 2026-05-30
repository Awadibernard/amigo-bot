import pino from "pino";
import { config } from "./config.js";
import { pushLog } from "./dashboard/state.js";

const base = pino({
  level: config.debug ? "debug" : config.logLevel,
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Wrapper qui pousse aussi dans le ring buffer du dashboard
function wrap(level) {
  return (a, b) => {
    base[level](a, b);
    const isObj = typeof a === "object" && a !== null;
    pushLog(level, isObj ? a : null, isObj ? (b || "") : (a || ""));
  };
}

export const logger = {
  info: wrap("info"),
  warn: wrap("warn"),
  error: wrap("error"),
  debug: wrap("debug"),
};
