/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { fromSnowflake, toSnowflake } from "@reflectcord/common/models";
import { voiceStates } from "@reflectcord/gateway/opcodes/VS";
import { emitEvent } from "@reflectcord/common/Events";
import { ChannelType } from "discord.js";
import { HTTPError } from "@reflectcord/common/utils";

export default () => <Resource> {
  post: async (req, res) => {
    const { channel_id } = req.params;
    const { recipients } = req.body;

    const rvChannelId = await fromSnowflake(channel_id!);
    const rvChannel = await res.rvAPIWrapper.channels.fetch(rvChannelId);

    if (
      rvChannel.discord.type !== ChannelType.DM
      && rvChannel.discord.type !== ChannelType.GroupDM
    ) {
      throw new HTTPError("You can't place a call in this channel.", 401);
    }

    const rvUserId = await res.rvAPIWrapper.users.getSelfId();
    const userId = await toSnowflake(rvUserId);
    const existingStates = await voiceStates.find({ channel_id }).toArray();

    const msg = await res.rvAPIWrapper.messages.sendMessage(rvChannelId, {
      content: "You are getting called!",
    });

    const userIds = rvChannel.discord.recipients?.map((x) => x.id) ?? [];
    const ringing = userIds
      ?.filter((x) => (x !== userId
      && !existingStates.find((state) => state.user_id === x)
      && (recipients?.length > 0 ? recipients?.includes(x) : true))) ?? [];

    await emitEvent({
      event: "CALL_UPDATE",
      data: {
        channel_id,
        guild_id: null,
        message_id: msg.discord.id,
        region: "",
        ringing,
      },
      channel_id: rvChannelId,
    });

    res.sendStatus(204);
  },
};
