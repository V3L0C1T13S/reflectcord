import { WebSocket } from "./Socket";

export function isDeprecatedClient(this: WebSocket) {
  return (!this.bot && this.version < 8);
}
