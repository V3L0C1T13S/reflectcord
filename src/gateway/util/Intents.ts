import { GatewayIntentBits, IntentsBitField } from "discord.js";

export class Intents {
  intents: IntentsBitField;
  // Gateway version
  version: number;
  bot = false;

  constructor(intents: number, version: number, bot?: boolean) {
    this.intents = new IntentsBitField(intents);
    this.version = version;
    this.bot = !!bot;
  }

  hasIntent(intent: GatewayIntentBits) {
    if (!this.bot || this.version < 8) return true;

    return this.intents.has(intent);
  }
}
