import { Channel as rvChannel } from "revolt-api";
import { APIChannel, ChannelType as discordChannelType } from "discord.js";
import { QuarkConversion } from "../QuarkConversion";
import { toSnowflake } from "../util";
import { User } from "./user";

export const ChannelType: QuarkConversion<rvChannel["channel_type"], discordChannelType> = {
  async to_quark(type) {
    switch (type) {
      case discordChannelType.DM: {
        return "DirectMessage";
      }
      case discordChannelType.GroupDM: {
        return "Group";
      }
      case discordChannelType.GuildText: {
        return "TextChannel";
      }
      case discordChannelType.GuildVoice: {
        return "VoiceChannel";
      }
      default: {
        return "TextChannel";
      }
    }
  },

  async from_quark(type) {
    switch (type) {
      case "DirectMessage": {
        return discordChannelType.DM;
      }
      case "SavedMessages": {
        return discordChannelType.DM;
      }
      case "Group": {
        return discordChannelType.GroupDM;
      }
      case "TextChannel": {
        return discordChannelType.GuildText;
      }
      case "VoiceChannel": {
        return discordChannelType.GuildVoice;
      }
      default: {
        throw new Error("Unhandled type");
      }
    }
  },
};

export const Channel: QuarkConversion<rvChannel, APIChannel> = {
  async to_quark(channel) {
    const { id, type } = channel;

    switch (type) {
      case discordChannelType.GuildText: {
        return {
          channel_type: "TextChannel",
          _id: id,
          server: channel.guild_id!,
          name: channel.name!,
          description: channel.topic ?? null,
          icon: null,
          last_message_id: channel.last_message_id ?? null,
          default_permissions: null, // FIXME,
          role_permissions: {
            a: 0,
            d: 0,
          } as any,
          nsfw: channel.nsfw ?? false,
        };
      }
      case discordChannelType.DM: {
        return {
          channel_type: "DirectMessage",
          _id: id,
          active: true,
          recipients: channel.recipients?.map((u) => u.id) ?? [""],
          last_message_id: channel.last_message_id ?? null,
        };
      }
      case discordChannelType.GroupDM: {
        return {
          channel_type: "Group",
          _id: id,
          active: true,
          owner: channel.owner_id ?? "fixme",
          name: channel.name ?? "fixme",
          recipients: channel.recipients?.map((u) => u.id) ?? [],
        };
      }
      case discordChannelType.GuildVoice: {
        return {
          channel_type: "VoiceChannel",
          _id: id,
          server: channel.guild_id ?? "0",
          name: channel.name ?? "fixme",
        };
      }
      default: {
        throw new Error(`Unhandled channel type ${type}`);
      }
    }
  },

  async from_quark(channel, excludedUser?: string) {
    const id = await toSnowflake(channel._id);

    return {
      // application_id: undefined,
      applied_tags: [] as string[],
      available_tags: [],
      default_reaction_emoji: null,
      default_sort_order: null,
      bitrate: undefined,
      guild_id: (() => {
        if (channel.channel_type === "TextChannel" || channel.channel_type === "VoiceChannel") {
          return channel.server;
        }
        return undefined as any;
      })(),
      icon: (() => {
        switch (channel.channel_type) {
          case "DirectMessage": {
            return;
          }
          case "SavedMessages": {
            return;
          }
          default: {
            return channel.icon?._id;
          }
        }
      })(),
      id,
      invitable: undefined,
      type: await ChannelType.from_quark(channel.channel_type) as any,
      last_message_id: await (() => {
        switch (channel.channel_type) {
          case "VoiceChannel": {
            return null;
          }
          case "SavedMessages": {
            return null;
          }
          default: {
            if (!channel.last_message_id) return null;
            return toSnowflake(channel.last_message_id);
          }
        }
      })(),
      name: (() => {
        if (channel.channel_type === "SavedMessages") {
          return "Saved Messages";
        }
        if (channel.channel_type === "DirectMessage") {
          return "fixme";
        }

        return channel.name;
      })(),
      recipients: await (() => {
        if (channel.channel_type === "DirectMessage" || channel.channel_type === "Group") {
          const excludedRecipients = channel.recipients.filter((x) => x !== excludedUser);
          return Promise.all(excludedRecipients.map((x) => User.from_quark({
            _id: x,
            username: "fixme",
          })));
        }

        return;
      })(),
      owner_id: undefined,
      origin_channel_id: id,
      created_at: Date.now(),
      nsfw: (() => {
        if (channel.channel_type !== "TextChannel") return false;

        return !!channel.nsfw;
      })(),
    };
  },
};
