import { Category, Channel as rvChannel, DataCreateChannel } from "revolt-api";
import {
  APIChannel,
  APIGuildCategoryChannel,
  APIOverwrite,
  APIPartialChannel,
  ChannelType as discordChannelType,
  OverwriteType,
  RESTPostAPIGuildChannelJSONBody,
} from "discord.js";
import { API } from "revolt.js";
import { QuarkConversion } from "../QuarkConversion";
import { fromSnowflake, toSnowflake, tryToSnowflake } from "../util";
import { User } from "./user";
import { convertPermNumber } from "./permissions";

export type ChannelATQ = {};

export type ChannelAFQ = Partial<{
  categoryId: string | null | undefined,
  excludedUser: string | null | undefined,
  allCategories: API.Category[] | null | undefined,
}>;

export const ChannelCreateType: QuarkConversion<"Text" | "Voice", discordChannelType> = {
  async to_quark(type) {
    switch (type) {
      case discordChannelType.GuildText: {
        return "Text";
      }
      case discordChannelType.GuildVoice: {
        return "Voice";
      }
      default: {
        return "Text";
      }
    }
  },

  async from_quark(type) {
    switch (type) {
      case "Text": {
        return discordChannelType.GuildText;
      }
      case "Voice": {
        return discordChannelType.GuildVoice;
      }
      default: {
        return discordChannelType.GuildText;
      }
    }
  },
};

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

export type GuildCategoryATQ = {};
export type GuildCategoryAFQ = Partial<{
  server: string | null | undefined,
}>;

export const GuildCategory: QuarkConversion<
  Category,
  APIGuildCategoryChannel,
  GuildCategoryATQ,
  GuildCategoryAFQ
> = {
  async to_quark(category) {
    const id = await (async () => {
      try {
        const sf = await fromSnowflake(category.id);
        return sf;
      } catch (e) {
        return category.id;
      }
    })();

    return {
      title: category.name ?? "",
      id,
      channels: [],
    };
  },

  async from_quark(category, extra) {
    // FIXME: For some reason, some categories are "a" "b" or "c" (possible legacy format?)
    const id = await tryToSnowflake(category.id);

    const discordCategory: APIGuildCategoryChannel = {
      id,
      name: category.title,
      type: discordChannelType.GuildCategory,
      position: 0,
    };

    if (extra?.server) discordCategory.guild_id = await toSnowflake(extra.server);

    return discordCategory;
  },
};

export interface PartialRevoltChannel {
  _id: rvChannel["_id"],
  channel_type: rvChannel["channel_type"]
  name?: string | undefined | null,
}

export const PartialChannel: QuarkConversion<PartialRevoltChannel, APIPartialChannel> = {
  async to_quark(channel) {
    const { name, id, type } = channel;

    return {
      name,
      channel_type: await ChannelType.to_quark(type),
      _id: await fromSnowflake(id),
    };
  },

  async from_quark(channel) {
    // eslint-disable-next-line camelcase
    const { name, _id, channel_type } = channel;

    const discordChannel: APIPartialChannel = {
      id: await toSnowflake(_id),
      type: await ChannelType.from_quark(channel_type),
    };

    if (name) discordChannel.name = name;

    return discordChannel;
  },
};

export const Channel: QuarkConversion<rvChannel, APIChannel, ChannelATQ, ChannelAFQ> = {
  async to_quark(channel) {
    const { id, type } = channel;

    const _id = await fromSnowflake(id);

    switch (type) {
      case discordChannelType.GuildText: {
        return {
          channel_type: "TextChannel",
          _id,
          server: channel.guild_id ? await fromSnowflake(channel.guild_id) : "0",
          name: channel.name ?? "fixme",
          description: channel.topic ?? null,
          icon: null,
          last_message_id: channel.last_message_id
            ? await fromSnowflake(channel.last_message_id)
            : null,
          default_permissions: null, // FIXME,
          nsfw: !!channel.nsfw,
        };
      }
      case discordChannelType.DM: {
        return {
          channel_type: "DirectMessage",
          _id,
          active: true,
          recipients: channel.recipients
            ? await Promise.all(channel.recipients.map((u) => fromSnowflake(u.id)))
            : [],
          last_message_id: channel.last_message_id
            ? await fromSnowflake(channel.last_message_id)
            : null,
        };
      }
      case discordChannelType.GroupDM: {
        return {
          channel_type: "Group",
          _id,
          active: true,
          owner: channel.owner_id ? await fromSnowflake(channel.owner_id) : "0",
          name: channel.name ?? "fixme",
          recipients: channel.recipients
            ? await Promise.all(channel.recipients.map((u) => fromSnowflake(u.id)))
            : [],
        };
      }
      case discordChannelType.GuildVoice: {
        return {
          channel_type: "VoiceChannel",
          _id,
          server: channel.guild_id ? await fromSnowflake(channel.guild_id) : "0",
          name: channel.name ?? "fixme",
        };
      }
      default: {
        throw new Error(`Unhandled channel type ${type}`);
      }
    }
  },

  async from_quark(channel, extra) {
    const id = await toSnowflake(channel._id);

    const categoryId = await (async () => {
      if (extra?.categoryId) {
        try {
          const sf = await toSnowflake(extra.categoryId);
          return sf;
        } catch {
          return extra.categoryId;
        }
      }

      const category = extra?.allCategories
        ?.find((x) => x.channels.includes(channel._id))?.id;

      if (!category) return null;

      try {
        const sf = await toSnowflake(category);
        return sf;
      } catch (e) {
        return category;
      }
    })();

    return {
      bitrate: undefined,
      guild_id: await (() => {
        if ("server" in channel && typeof channel.server === "string") {
          return toSnowflake(channel.server);
        }
        return undefined as any;
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
          const excludedRecipients = channel.recipients.filter((x) => x !== extra?.excludedUser);

          return Promise.all(excludedRecipients.map((x) => User.from_quark({
            _id: x,
            username: "fixme",
          })));
        }

        return;
      })(),
      owner_id: await (() => {
        if (channel.channel_type === "Group") {
          return toSnowflake(channel.owner);
        }

        return;
      })(),
      origin_channel_id: id,
      nsfw: (() => {
        if (channel.channel_type !== "TextChannel") return false;

        return !!channel.nsfw;
      })(),
      permission_overwrites: await (async () => {
        if (channel.channel_type !== "TextChannel" && channel.channel_type !== "VoiceChannel") return [];

        const discordOverrides: APIOverwrite[] = [];

        const everyoneStub = {
          id: await toSnowflake(channel.server),
          type: OverwriteType.Role,
          allow: "0",
          deny: "0",
        };

        if (("default_permissions" in channel) && channel.default_permissions) {
          everyoneStub.allow = convertPermNumber(channel.default_permissions.a).toString();
          everyoneStub.deny = convertPermNumber(channel.default_permissions.d).toString();
        }

        discordOverrides.push(everyoneStub);

        if (!("role_permissions" in channel) && !channel.role_permissions) return discordOverrides;

        const overrides = Object.entries(channel.role_permissions);

        await Promise.all(overrides.map(async ([key, x]) => {
          const roleId = await toSnowflake(key);
          const type = OverwriteType.Role;
          const allow = convertPermNumber(x.a).toString();
          const deny = convertPermNumber(x.d).toString();

          discordOverrides.push({
            id: roleId,
            type,
            allow,
            deny,
          });
        }));

        return discordOverrides;
      })(),
      topic: ("description" in channel) ? channel.description : null,
      parent_id: categoryId,
      position: 0,
    };
  },
};

export async function HandleChannelsAndCategories(
  channels: rvChannel[],
  categories?: Category[] | null,
  server?: string,
) {
  const discordChannels = await Promise.all(channels
    .map((x) => Channel.from_quark(x, {
      allCategories: categories,
    })));
  const discordCategories = categories ? await Promise.all(categories
    .map((x) => GuildCategory.from_quark(x, {
      server,
    })))
    : [];

  return [...discordChannels, ...discordCategories];
}

export const ChannelCreateBody: QuarkConversion<
DataCreateChannel, RESTPostAPIGuildChannelJSONBody
> = {
  async to_quark(data) {
    const { name, type, nsfw } = data;
    return {
      name,
      type: type ? await ChannelCreateType.to_quark(type) : "Text",
      nsfw: nsfw ?? null,
      description: ("topic" in data && data.topic) ? data.topic : null,
    };
  },

  async from_quark(data) {
    const { name, type, nsfw } = data;
    return {
      name,
      // type: type ? await ChannelCreateType.from_quark(type) : discordChannelType.GuildText,
      nsfw: !!nsfw,
    };
  },
};
