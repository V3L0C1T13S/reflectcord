/* eslint-disable no-restricted-syntax */
/* eslint-disable camelcase */
import {
  APIMessage,
  APIMessageReference,
  APIUser,
  ComponentType,
  MessageType,
  ButtonStyle,
  APIButtonComponent,
  APIButtonComponentWithCustomId,
  ChannelType,
} from "discord.js";
import fileUpload from "express-fileupload";
import API, { Message as RevoltMessage } from "revolt-api";
import { decodeTime } from "ulid";
import { uploadFile } from "@reflectcord/cdn/util";
import { systemUserID } from "@reflectcord/common/rvapi";
import { UploadedFile } from "@reflectcord/common/mongoose";
import { Logger } from "@reflectcord/common/utils";
import { QuarkConversion } from "../QuarkConversion";
import {
  fromSnowflake, toSnowflake, tryFromSnowflake, tryToSnowflake,
} from "../util";
import { Attachment } from "./attachment";
import { Embed, SendableEmbed } from "./embed";
import { Reactions } from "./emoji";
import { User } from "./user";
import { MessageCreateSchema } from "../../sparkle";
import { FileIsNewAttachment } from "../../sparkle/schemas/Channels/messages/Attachment";
import {
  CHANNEL_MENTION, REVOLT_CHANNEL_MENTION, REVOLT_USER_MENTION,
  USER_MENTION,
  EMOJI_REGEX,
  REVOLT_EMOJI_REGEX,
  isOnlyEmoji,
  REVOLT_ULID,
  SNOWFLAKE,
  toCompatibleISO,
} from "../../utils";

// The invisible unicode is a special signal that this is a Reflectcord made embed.
export const interactionTitle = "‎Interactions‎";
export const disabledComponentText = "(Disabled)";

async function replaceAsync(
  str: string,
  regex: RegExp,
  asyncFn: (match: string) => Promise<string>,
): Promise<string> {
  const promises = (str.match(regex) ?? []).map((match: string) => asyncFn(match));
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift()!);
}

export const extractComponentName = (x: string) => x.slice(3);
export const extractComponentCustomId = (x: string) => x.split("CID:")[1]?.split(" ")[0] ?? "FIXME_BAD_CID";
export const extractComponentStyle = (x: string) => x.split("ST:")[1]?.split(" ")[0]?.toNumber() ?? ButtonStyle.Primary;
export const extractComponents = (description: string) => description.split("\n");
export const extractInteractionNames = (description: string) => extractComponents(description)
  .map(extractComponentName);
export const extractInteractionNumbers = (description: string) => extractComponents(description)
  .map((x) => x[0]?.toNumber())
  .filter((x): x is number => x !== undefined);
export const findComponentByName = (
  description: string,
  name: string,
) => extractComponents(description).find((x) => extractComponentName(x) === name);
export const findComponentByCID = (
  description: string,
  name: string,
) => extractComponents(description).find((x) => extractComponentCustomId(x) === name);
export const findComponentByIndex = (
  description: string,
  index: number,
) => extractComponents(description).find((x) => x[0]?.toNumber() === index);
// FIXME: May mess up bots
export const isButtonDisabled = (x: string) => x.endsWith(` ${disabledComponentText}`);

/**
 * Convert a component descriptor to a component
*/
export const convertDescriptorToComponent = (
  componentDescriptor: string,
): APIButtonComponentWithCustomId => ({
  custom_id: extractComponentCustomId(componentDescriptor),
  label: extractComponentName(componentDescriptor),
  style: extractComponentStyle(componentDescriptor),
  type: ComponentType.Button,
  disabled: isButtonDisabled(componentDescriptor),
});

export const convertEmbedDescriptorToComponents = (
  description: string,
): APIButtonComponentWithCustomId[] => extractComponents(description)
  .map((x) => convertDescriptorToComponent(x));
export type APIMention = {
  id: string,
  type: number,
  content: string,
  channel_id: string,
  author: APIUser,
};

type messageReferenceRevolt = {
  id: string,
  channel_id: string,
  server?: string | null | undefined,
}

export type MessageATQ = {};

export type MessageAFQ = Partial<{
  user: API.User | null | undefined,
  mentions: API.User[] | null | undefined,
  server: string | null,
  api_version: number,
  replied_message: APIMessage | null,
  selfUserId: string | null,
}>

export const MessageReference: QuarkConversion<
  messageReferenceRevolt,
  APIMessageReference
> = {
  async to_quark(reference) {
    const revoltRef: messageReferenceRevolt = {
      id: reference.message_id ? await fromSnowflake(reference.message_id) : "0",
      channel_id: await fromSnowflake(reference.channel_id),
      server: reference.guild_id ? await toSnowflake(reference.guild_id) : null,
    };

    return revoltRef;
  },

  async from_quark(reference) {
    const discordRef: APIMessageReference = {
      message_id: await toSnowflake(reference.id),
      channel_id: await toSnowflake(reference.channel_id),
    };

    if (reference.server) discordRef.guild_id = await toSnowflake(reference.server);

    return discordRef;
  },
};

export const Message: QuarkConversion<RevoltMessage, APIMessage, MessageATQ, MessageAFQ> = {
  async to_quark(message) {
    const {
      content, id, author, embeds, channel_id, attachments, message_reference,
    } = message;

    return {
      _id: await fromSnowflake(id),
      content: content?.replace(/\|\|(([\w\s])+)\|\|/g, "!!$1!!"),
      author: await fromSnowflake(author.id),
      channel: await fromSnowflake(channel_id),
      embeds: await Promise.all(embeds.map((x) => Embed.to_quark(x))),
      attachments: await Promise.all(attachments.map((x) => Attachment.to_quark(x))),
      replies: message_reference?.message_id
        ? [message_reference.message_id]
        : null,
    };
  },

  async from_quark(message, extra) {
    const {
      _id, channel, content, author, attachments, embeds, reactions, replies, mentions, masquerade,
    } = message;

    const authorUser = extra?.user
      ? await User.from_quark(extra.user, {
        masquerade,
      })
      : await User.from_quark({
        _id: author,
        username: "fixme",
        discriminator: "0001",
      }, {
        masquerade,
      });

    const channel_id = await toSnowflake(channel);

    const reply = replies?.[0] ?? null;

    const discordMessage: APIMessage = {
      id: await toSnowflake(_id),
      channel_id,
      content: content?.replace(/\|\|.+\|\|/gs, (match) => `\\${match}`)
        // Translate !!Revite spoilers!! to ||Discord spoilers||
        .replace(
          /!!.+!!/g,
          (match) => `||${match.substring(2, match.length - 2)}||`,
        ) ?? "",
      author: await (async () => {
        if (message.author === systemUserID) {
          if (message.system) {
            if (
              message.system.type === "user_kicked"
            || message.system.type === "user_banned"
            || message.system.type === "user_joined"
            ) {
              return {
                id: await toSnowflake(message.system.id),
                username: "System",
                discriminator: "1",
                avatar: null,
              };
            }
            if (message.system.type === "user_added" || message.system.type === "user_remove") {
              return authorUser;
            }
            if (message.system.type === "channel_renamed") {
              return {
                id: await toSnowflake(message.system.by),
                username: "System",
                discriminator: "1",
                avatar: null,
              };
            }
          }
        }

        return authorUser;
      })(),
      timestamp: toCompatibleISO(new Date(decodeTime(_id)).toISOString()),
      edited_timestamp: message.edited
        ? toCompatibleISO(new Date(message.edited).toISOString())
        : null,
      tts: false,
      mention_everyone: false,
      mentions: mentions ? await Promise.all(
        extra?.mentions
          ?.map((x) => User.from_quark(x)) ?? mentions.map((x) => User.from_quark({
          _id: x,
          username: "fixme",
          discriminator: "0001",
        })),
      ) : [],
      attachments: attachments
        ? await Promise.all(attachments.map((x) => Attachment.from_quark(x)))
        : [],
      mention_roles: [],
      embeds: embeds
        ? await Promise.all(embeds.map((x) => Embed.from_quark(x)))
        : [],
      pinned: false,
      type: (() => {
        if (reply) {
          return MessageType.Reply;
        }

        if (message.system) {
          switch (message.system.type) {
            case "user_joined": {
              return MessageType.UserJoin;
            }
            case "user_added": {
              return MessageType.RecipientAdd;
            }
            case "user_remove": {
              return MessageType.RecipientRemove;
            }
            case "channel_renamed": {
              return MessageType.ChannelNameChange;
            }
            case "channel_icon_changed": {
              return MessageType.ChannelIconChange;
            }
            default: {
              return MessageType.Default;
            }
          }
        }

        return MessageType.Default;
      })(),
      reactions: await Reactions.from_quark(reactions, {
        selfId: extra?.selfUserId ?? null,
      }),
    };

    const interactionEmbed = discordMessage.embeds?.last();

    if (interactionEmbed?.title === interactionTitle && interactionEmbed.description) {
      try {
        // To prevent potential bugs, we remove this embed on the discord side.
        discordMessage.embeds?.pop();

        discordMessage.components ??= [];
        discordMessage.components.push({
          type: ComponentType.ActionRow,
          components: convertEmbedDescriptorToComponents(interactionEmbed.description),
        });
      } catch (e) {
        Logger.error(`Failed to create components - This may be due to a malformed interaction embed. ${e}`);
      }
    }

    if (extra?.replied_message) {
      discordMessage.referenced_message = extra.replied_message;
    }

    const selectedInteractions = message.interactions?.reactions
      ?.filter((x) => REVOLT_ULID.test(x));
    if (selectedInteractions && selectedInteractions.length > 0) {
      discordMessage.components ??= [];
      discordMessage.components.push({
        type: ComponentType.ActionRow,
        components: await Promise.all(selectedInteractions.map(async (reaction) => ({
          custom_id: reaction,
          type: ComponentType.Button,
          style: ButtonStyle.Primary,
          emoji: {
            id: await toSnowflake(reaction),
            name: "fixme",
          },
        }))),
      });
    }

    if (masquerade?.name) {
      discordMessage.webhook_id = discordMessage.author.id;
      // discordMessage.application_id = discordMessage.author.id;
      discordMessage.author = {
        ...discordMessage.author,
        discriminator: "0000",
      };
    }

    if (reply) {
      discordMessage.message_reference = await MessageReference.from_quark({
        id: reply,
        channel_id: message.channel,
        server: extra?.server,
      });
    }

    if (message.nonce) discordMessage.nonce = await tryToSnowflake(message.nonce);

    if (message.system) {
      switch (message.system.type) {
        case "text": {
          discordMessage.content = message.system.content;
          break;
        }
        case "user_added": {
          discordMessage.mentions.push(await User.from_quark({
            _id: message.system.id,
            username: "fixme",
            discriminator: "0001",
          }));

          break;
        }
        case "user_left": {
          discordMessage.content = `<@${await toSnowflake(message.system.id)}> left.`;
          break;
        }
        case "user_banned": {
          discordMessage.content = `<@${await toSnowflake(message.system.id)}> was banned.`;
          break;
        }
        case "user_kicked": {
          discordMessage.content = `<@${await toSnowflake(message.system.id)}> was kicked.`;
          break;
        }
        case "channel_renamed": {
          discordMessage.content = message.system.name;
          break;
        }
        default: {
          break;
        }
      }
    } else {
      discordMessage.content = await replaceAsync(
        discordMessage.content,
        REVOLT_CHANNEL_MENTION,
        async (match) => `<#${await tryToSnowflake(match.substring(2, match.length - 1))}>`,
      );

      discordMessage.content = await replaceAsync(
        discordMessage.content,
        REVOLT_USER_MENTION,
        async (match) => `<@${await tryToSnowflake(match.substring(2, match.length - 1))}>`,
      );

      discordMessage.content = await replaceAsync(
        discordMessage.content,
        REVOLT_EMOJI_REGEX,
        async (match) => {
          if (!isOnlyEmoji(match)) return match;

          const emojiId = match.substring(1, match.length - 1);
          if (!REVOLT_ULID.test(emojiId)) return match;

          return `<a:fixme:${await toSnowflake(emojiId)}>`;
        },
      );
    }

    return discordMessage;
  },
};

export type MessageSendDataATQ = {
  files?: fileUpload.FileArray | MessageCreateSchema["attachments"] | null | undefined,
}

export const MessageSendData: QuarkConversion<
  API.DataMessageSend,
  MessageCreateSchema,
  MessageSendDataATQ
> = {
  async to_quark(data, extra) {
    const { content, embeds, message_reference } = data;

    const sendData: API.DataMessageSend = {
      content: content?.replace(
        /!!.+!!/g,
        (match) => `!\u200b!${match.substring(2, match.length - 2)}!!`,
      )
      // Translate ||Discord spoilers|| to !!Revite spoilers!!,
      // while making sure multiline spoilers continue working
        .replace(/\|\|.+\|\|/gs, (match) => match
          .substring(2, match.length - 2)
          .split("\n")
          .map((line) => `!!${line.replace(/!!/g, "!\u200b!")}!!`)
          .join("\n")) ?? " ",
      embeds: embeds ? await Promise.all(embeds.map((x) => SendableEmbed.to_quark(x))) : null,
      replies: message_reference ? [{
        id: await fromSnowflake(message_reference.message_id),
        // Discord documentation is wrong. This defaults to true.
        mention: data.allowed_mentions?.replied_user ?? true,
      }] : null,
      nonce: data.nonce?.toString() ?? null,
      // TODO: Cleanup
      attachments: extra?.files ? (await Promise.all((
        Array.isArray(extra.files) ? extra.files : Object.values(extra.files))
        .map(async (x) => {
          const file = Array.isArray(x) ? x?.[0] : x;
          if (!file) return;

          if (!Array.isArray(x) && FileIsNewAttachment(file) && file.uploaded_filename) {
            const upload_id = file.uploaded_filename.split("/")[0];
            const uploadedFile = await UploadedFile.findById(upload_id);

            if (!uploadedFile?.autumn_id) throw new Error(`Bad file ID ${upload_id}`);

            return uploadedFile.autumn_id;
          }

          if (!("data" in file)) throw new Error("We can't determine what type of file this is. Please report this!");

          const id = await uploadFile("attachments", {
            name: file.name,
            file: file.data,
          }, file.mimetype);

          return id;
        }))).filter((x) => x) as string[] : null,
    };

    if (data.components?.[0]) {
      const allComponents = data.components.flatMap((action) => action.components);
      /*
      const selectedComponents = allComponents
        .filter((x): x is APIButtonComponent => x.type === ComponentType.Button && !!x.emoji?.id);

      const ids = selectedComponents.map((x) => x.emoji!.id!);
      */

      // FIXME: This part requires a stupid hack - we may want to consider using content instead...
      sendData.embeds ??= [];
      // FIXME (interactions): We're mapping all components as a button... Obviously, not good.
      sendData.embeds.push({
        title: interactionTitle,
        // eslint-disable-next-line no-nested-ternary
        description: allComponents.map((x, i) => `${i}: ${"label" in x ? x.label : "No label"} CID:${"custom_id" in x ? x.custom_id : "FIXME"} ST:${x.type === ComponentType.Button ? x.style : ButtonStyle.Primary} ${x.disabled ? `${disabledComponentText}` : ""}`).join("\n"),
      });

      /*
      if (selectedComponents.length > 0) {
        sendData.interactions = {
          reactions: await multipleFromSnowflake(ids),
        };
      }
      */
    }

    if (sendData.content) {
      sendData.content = await replaceAsync(
        sendData.content,
        CHANNEL_MENTION,
        async (match) => `<#${await tryFromSnowflake(match.substring(2, match.length - 1))}>`,
      );

      sendData.content = await replaceAsync(
        sendData.content,
        USER_MENTION,
        async (match) => `<@${await tryFromSnowflake(match.substring(2, match.length - 1))}>`,
      );

      sendData.content = await replaceAsync(
        sendData.content,
        EMOJI_REGEX,
        async (match) => {
          const fullId = match.split(":").last();
          const id = fullId?.slice(0, fullId.length - 1);
          if (!id) return match;

          return `:${await tryFromSnowflake(id)}:`;
        },
      );
    }

    return sendData;
  },

  async from_quark(data) {
    const { content, embeds, replies } = data;

    const reply = replies?.[0] ?? null;

    return {
      content: content ?? "** **",
      embeds: embeds
        ? await Promise.all(embeds.map((x) => SendableEmbed.from_quark(x))) as any // TODO: Types
        : undefined,
      nonce: data.nonce ?? undefined,
    };
  },
};

/**
 * @summary Filter a message using the specified intents
 *
 * @param message The message to filter
 *
 * @param intents Intents to apply. Refer to Discords documentation for more info.
 * https://discord.com/developers/docs/topics/gateway#message-content-intent
 *
 * @param data Data for accurate filtering
*/
export function filterMessageObject(
  message: APIMessage,
  intents: { messageContent?: boolean },
  data: { user: string, channelType: ChannelType },
) {
  const filtered = { ...message };

  if (
    message.author.id !== data.user
    && !message.mentions.find((x) => x.id === data.user)
    && data.channelType !== ChannelType.DM
  ) {
    if (!intents.messageContent) {
      filtered.content = "";
      filtered.embeds = [];
      filtered.attachments = [];
      filtered.components = [];
    }
  }

  return filtered;
}
