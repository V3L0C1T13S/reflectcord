import { TypedEmitter } from "tiny-typed-emitter";

export interface dbEvents {
  "CHANNEL_START_TYPING": (channel: string, token: string) => any;
}

export const dbEventBus = new TypedEmitter<dbEvents>();
