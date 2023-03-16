/* eslint-disable camelcase */
import {
  Category, Channel as rvChannel, DataCreateChannel, DataEditChannel, FieldsChannel,
} from "revolt-api";
import {
  APIChannel,
  APIDMChannel,
  APIGroupDMChannel,
  APIGuildCategoryChannel,
  APIGuildTextChannel,
  APIOverwrite,
  APIPartialChannel,
  APIUser,
  ChannelType as discordChannelType,
  OverwriteType,
  RESTPatchAPIChannelJSONBody,
  RESTPostAPIGuildChannelJSONBody,
} from "discord.js";
import { API } from "revolt.js";
import { QuarkConversion } from "../QuarkConversion";
import {
  fromSnowflake, hashToSnowflake, multipleFromSnowflake, toSnowflake, tryToSnowflake,
} from "../util";
import { User } from "./user";
import { convertPermNumber } from "./permissions";
import { APIChannelPatchBody } from "../../sparkle";

function alphabetPosition(text: string) {
  return [...text].map((a) => parseInt(a, 36) - 10).filter((a) => a >= 0);
}

export type ChannelATQ = {};

export type ChannelAFQ = Partial<{
  /**
   * Direct category ID for this channel.
   * Giving it here directly is faster, but having it sort
   * itself with allCategories gives higher accuracy, since
   * we can find things like the channel position.
  */
  categoryId: string | null | undefined,
  /**
   * User to exclude from DM/Group recipients.
  */
  excludedUser: string | null | undefined,
  /**
   * If supplied, from_quark will search for the category this
   * channel is in, and also find the position automatically.
  */
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
  allCategories: API.Server["categories"] | null | undefined,
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
    // Workaround for legacy format ("a", "b", "c") - insert pls migrate
    const id = await (async () => {
      try {
        const sf = await toSnowflake(category.id);
        return sf;
      } catch {
        return alphabetPosition(category.id).toString();
      }
    })();
    const position = extra?.allCategories?.findIndex((x) => x.id === category.id) ?? 0;

    const discordCategory: APIGuildCategoryChannel = {
      permission_overwrites: [],
      name: category.title,
      parent_id: null,
      nsfw: false,
      position,
      type: discordChannelType.GuildCategory,
      id,
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
            ? await multipleFromSnowflake(channel.recipients.map((x) => x.id))
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
            ? await multipleFromSnowflake(channel.recipients.map((x) => x.id))
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
          // Yes, this is a crappy hack.
          // Yes, we are using the position of the category in the alphabet as an ID.
          // No, I don't care + ratio + pls migrate revolt lounge categories insert
          return alphabetPosition(extra.categoryId).toString();
        }
      }

      const category = extra?.allCategories
        ?.find((x) => x.channels.includes(channel._id))?.id;

      if (!category) return null;

      try {
        const sf = await toSnowflake(category);
        return sf;
      } catch (e) {
        return alphabetPosition(category).toString();
      }
    })();

    const position = extra?.allCategories
      ? extra.allCategories.findIndex((x) => x.channels.includes(channel._id))
      : 0;

    const channelType = await ChannelType.from_quark(channel.channel_type) as any;

    // Workaround for weird typechecking bug
    const commonProperties: {
      guild_id?: string,
      owner_id?: string,
      recipients?: APIUser[],
      bitrate?: number,
      user_limit?: number,
    } = {};

    if ("server" in channel && typeof channel.server === "string") {
      commonProperties.guild_id = await toSnowflake(channel.server);
    }

    if (channel.channel_type === "DirectMessage" || channel.channel_type === "Group") {
      if (channel.channel_type === "Group") {
        commonProperties.owner_id = await toSnowflake(channel.owner);
      }

      const excludedRecipients = channel.recipients.filter((x) => x !== extra?.excludedUser);

      commonProperties.recipients = await Promise.all(excludedRecipients
        .map((x) => User.from_quark({
          _id: x,
          username: "fixme",
        })));
    } else if (channel.channel_type === "SavedMessages") {
      commonProperties.recipients = [await User.from_quark({
        _id: channel.user,
        username: "Saved Messages",
      })];
    } else if (channel.channel_type === "VoiceChannel") {
      commonProperties.bitrate = 0;
      commonProperties.user_limit = 0;
    }

    return {
      ...commonProperties,
      id,
      default_auto_archive_duration: 60,
      invitable: undefined,
      type: channelType,
      last_message_id: "last_message_id" in channel && channel.last_message_id
        ? await toSnowflake(channel.last_message_id) : null,
      name: (() => {
        if (channel.channel_type === "SavedMessages") {
          return "Saved Messages";
        }
        if (channel.channel_type === "DirectMessage") {
          return "fixme";
        }

        return channel.name;
      })(),
      origin_channel_id: id,
      nsfw: (() => {
        if (channel.channel_type !== "TextChannel"
        && channel.channel_type !== "VoiceChannel") return false;

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
      position,
      icon: ("icon" in channel && channel.icon) ? await hashToSnowflake(channel.icon._id) : null,
    };
  },

  // @ts-ignore
  async from_quark_new(channel: API.Channel, extra: ChannelAFQ) {
    const id = await toSnowflake(channel._id);

    const categoryId = await (async () => {
      if (extra?.categoryId) {
        try {
          const sf = await toSnowflake(extra.categoryId);
          return sf;
        } catch {
          return "0";
        }
      }

      const category = extra?.allCategories
        ?.find((x) => x.channels.includes(channel._id))?.id;

      if (!category) return null;

      try {
        const sf = await toSnowflake(category);
        return sf;
      } catch (e) {
        return "0";
      }
    })();

    const position = extra?.allCategories
      ? extra.allCategories.findIndex((x) => x.channels.includes(channel._id))
      : 0;

    switch (channel.channel_type) {
      case "DirectMessage": {
        const excludedRecipients = channel.recipients.filter((x) => x !== extra?.excludedUser);

        return {
          last_message_id: channel.last_message_id
            ? await toSnowflake(channel.last_message_id)
            : null,
          type: discordChannelType.DM,
          id,
          recipients: await Promise.all(excludedRecipients
            .map((x) => User.from_quark({
              _id: x,
              username: "fixme",
            }))),
        } as APIDMChannel;
      }
      case "Group": {
        const excludedRecipients = channel.recipients.filter((x) => x !== extra?.excludedUser);

        return {
          name: channel.name,
          icon: channel.icon ? await hashToSnowflake(channel.icon._id) : null,
          recipients: await Promise.all(excludedRecipients
            .map((x) => User.from_quark({
              _id: x,
              username: "fixme",
            }))),
          last_message_id: channel.last_message_id
            ? await toSnowflake(channel.last_message_id)
            : null,
          type: discordChannelType.GroupDM,
          id,
          owner_id: await toSnowflake(channel.owner),
        } as APIGroupDMChannel;
      }
      case "SavedMessages": {
        return {
          last_message_id: null,
          type: discordChannelType.DM,
          id,
          recipients: [await User.from_quark({
            _id: channel.user,
            username: "Saved Messages",
          })],
        } as APIDMChannel;
      }
      case "TextChannel": {
        const discordChannel: APIGuildTextChannel<discordChannelType.GuildText> = {
          id,
          guild_id: await toSnowflake(channel.server),
          name: channel.name,
          type: discordChannelType.GuildText,
          position,
        };

        return discordChannel;
      }
      case "VoiceChannel": {
        return {};
      }
      default: {
        throw new Error(`unimplemented channel type: ${channel}`);
      }
    }
  },
};

export async function HandleChannelsAndCategories(
  channels: rvChannel[],
  categories?: Category[] | null,
  server?: string,
  deprecated?: boolean,
) {
  const discordChannels = await Promise.all(channels
    .map((x) => Channel.from_quark(x, {
      allCategories: categories,
    })));

  if (deprecated) return discordChannels;

  const discordCategories = categories ? await Promise.all(categories
    .map((x) => GuildCategory.from_quark(x, {
      server,
      allCategories: categories,
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

export const ChannelPatchBody: QuarkConversion<
DataEditChannel, APIChannelPatchBody
> = {
  async to_quark(data) {
    const remove: FieldsChannel[] = [];

    if (data.icon === null) remove.push("Icon");

    const body: DataEditChannel = {
      name: data.name ?? null,
      description: data.topic ?? null,
      nsfw: data.nsfw ?? null,
    };

    if (remove.length > 0) body.remove = remove;

    return body;
  },

  async from_quark(data) {
    const body: RESTPatchAPIChannelJSONBody = {};

    if (data.name) body.name = data.name;
    if (data.description) body.topic = data.description;

    return body;
  },
};
