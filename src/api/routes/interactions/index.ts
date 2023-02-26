/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { interactionTitle, multipleFromSnowflake, findComponentByName } from "@reflectcord/common/models";
import { InteractionType } from "discord.js";
import { HTTPError } from "@reflectcord/common/utils";
import { digitMap } from "@reflectcord/common/managers";
import { emitEvent } from "@reflectcord/common/Events";
import { GatewayDispatchCodes } from "@reflectcord/common/sparkle";

const supportedTypes = [InteractionType.MessageComponent];

export default () => <Resource> {
  post: async (req, res) => {
    const {
      message_id, channel_id, type, data, nonce,
    } = req.body;

    if (!supportedTypes.includes(type)) throw new HTTPError(`Unimplemented interaction type ${type}`, 500);

    const [rvMessageId, channelId] = await multipleFromSnowflake([message_id, channel_id]);

    const message = await res.rvAPIWrapper.messages.fetch(channelId!, rvMessageId!);

    const interactionEmbed = message.revolt.embeds?.last();
    if (interactionEmbed?.type !== "Text" || interactionEmbed.title !== interactionTitle || !interactionEmbed.description) {
      throw new HTTPError("This message has no valid interactions.");
    }

    const selected = findComponentByName(interactionEmbed.description, data.custom_id);

    const selectedNumber = selected?.[0]?.toNumber();
    if (selectedNumber === undefined) throw new HTTPError("Invalid index");

    const emoji = digitMap[selectedNumber];
    if (!emoji) throw new HTTPError("Emoji index out of range");

    // @ts-ignore
    await res.rvAPI.put(encodeURI(`/channels/${channelId as ""}/messages/${rvMessageId as ""}/reactions/${emoji as ""}`));

    const currentUser = await res.rvAPIWrapper.users.fetchSelf();
    await emitEvent({
      user_id: currentUser.revolt._id,
      event: GatewayDispatchCodes.InteractionCreate,
      data: {
        id: message_id,
        nonce,
      },
    });
    await emitEvent({
      user_id: currentUser.revolt._id,
      event: GatewayDispatchCodes.InteractionSuccess,
      data: {
        id: message_id,
        nonce,
      },
    });

    res.sendStatus(204);
  },
};
