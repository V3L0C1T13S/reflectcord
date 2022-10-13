import { Channel as rvChannel } from "revolt-api";
import { APIChannel, ChannelType } from "discord.js";
import { QuarkConversion } from "../QuarkConversion";

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
      default: {
        throw new Error(`Unhandled channel type ${type}`);
      }
    }
  },

  async from_quark(channel) {
    return {
      application_id: undefined,
      applied_tags: [] as string[],
      bitrate: undefined,
      default_auto_archive_duration: undefined,
      guild_id: (() => {
        if (channel.channel_type === "TextChannel" || channel.channel_type === "VoiceChannel") {
          return channel.server;
        }
        return undefined;
      })(),
      icon: undefined,
      id: channel._id,
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
      last_message_id: (() => {
        switch (channel.channel_type) {
          case "VoiceChannel": {
            return null;
          }
          case "SavedMessages": {
            return null;
          }
          default: {
            return channel.last_message_id ?? null;
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
    };
  },
};
