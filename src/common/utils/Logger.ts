/* eslint-disable no-console */
import { enableLogging } from "../constants";

export namespace Logger {
  export function prependDate(...data: any) {
    return `[${new Date().toISOString().replace(/T/, " ").replace(/\..+/, "")}] ${data}`;
  }

  export function log(...args: any) {
    if (!enableLogging) return;

    console.log(`${prependDate(...args)}`);
  }

  export function warn(...args: any) {
    console.warn(prependDate("[WARN]:"), ...args);
  }

  export function error(...args: any) {
    console.error(prependDate("[ERROR]:"), ...args);
  }

  export function info(...args: any) {
    log("[INFO]:", ...args);
  }

  export function debug(...args: any) {
    console.debug(prependDate("[DEBUG]:"), ...args);
  }
}
