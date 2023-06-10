import {
  APIChannel, GatewayIntentBits, IntentsBitField,
} from "discord.js";

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

  hasTypingIntent(channel: APIChannel) {
    return this.hasIntent("guild_id" in channel ? GatewayIntentBits.GuildMessageTyping : GatewayIntentBits.DirectMessageTyping);
  }

  hasMessagesIntent(channel: APIChannel) {
    return this.hasIntent("guild_id" in channel ? GatewayIntentBits.GuildMessages : GatewayIntentBits.DirectMessages);
  }

  hasMessageReactionsIntent(channel: APIChannel) {
    return this.hasIntent("guild_id" in channel ? GatewayIntentBits.GuildMessageReactions : GatewayIntentBits.DirectMessageReactions);
  }

  hasGuildMembersIntent(data: { memberId: string, selfId: string }) {
    return data.memberId === data.selfId || this.hasIntent(GatewayIntentBits.GuildMembers);
  }

  hasGuildsIntent() {
    return this.hasIntent(GatewayIntentBits.Guilds);
  }
}
