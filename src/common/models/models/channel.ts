import { Channel as rvChannel } from "revolt-api";
import { APIChannel, ChannelType } from "discord.js";
import { QuarkConversion } from "../QuarkConversion";
import { toSnowflake } from "../util";

export const Channel: QuarkConversion<rvChannel, APIChannel> = {
  async to_quark(channel) {
    const { id, type } = channel;

    switch (type) {
      case ChannelType.GuildText: {
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
      case ChannelType.DM: {
        return {
          channel_type: "DirectMessage",
          _id: id,
          active: true,
          recipients: channel.recipients?.map((u) => u.id) ?? [""],
          last_message_id: channel.last_message_id ?? null,
        };
      }
      case ChannelType.GroupDM: {
        return {
          channel_type: "Group",
          _id: id,
          active: true,
          owner: channel.owner_id ?? "fixme",
          name: channel.name ?? "fixme",
          recipients: channel.recipients?.map((u) => u.id) ?? [],
        };
      }
      case ChannelType.GuildVoice: {
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

  async from_quark(channel) {
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
      type: ((): any => {
        switch (channel.channel_type) {
          case "DirectMessage": {
            return ChannelType.DM;
          }
          case "SavedMessages": {
            return ChannelType.DM;
          }
          case "Group": {
            return ChannelType.GroupDM;
          }
          case "TextChannel": {
            return ChannelType.GuildText;
          }
          case "VoiceChannel": {
            return ChannelType.GuildVoice;
          }
          default: {
            throw new Error("Unhandled type");
          }
        }
      })(),
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
          return Promise.all(channel.recipients.map((x) => toSnowflake(x)));
        }

        return;
      })(),
      owner_id: undefined,
      origin_channel_id: id,
    };
  },
};
