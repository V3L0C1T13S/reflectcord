import { Resource } from "express-automatic-routes";
import { Activities, ActivityCreateParams, GatewayDispatchCodes } from "@reflectcord/common/sparkle";
import { emitEvent } from "@reflectcord/common/Events";
import { Logger, HTTPError } from "@reflectcord/common/utils";
import { fromSnowflake } from "@reflectcord/common/models";
import { VoiceState } from "@reflectcord/common/mongoose";

export default () => <Resource> {
  post: async (req, res) => {
    const { appId, channelId, guildId } = req.params as unknown as ActivityCreateParams;

    const app = Activities[appId];
    if (!app) {
      Logger.warn(`Unhandled app ${appId}!`);
      throw new HTTPError("Invalid activity ID", 404);
    }

    const serverId = await fromSnowflake(guildId);
    const rvChannelId = await fromSnowflake(channelId);

    const user = await res.rvAPIWrapper.users.fetchSelf();

    const state = await VoiceState.findOne({
      user_id: user.discord.id,
      channel: channelId,
      guild_id: guildId,
    });

    if (!state) throw new HTTPError("No voice state", 401);

    await emitEvent({
      guild_id: serverId,
      event: GatewayDispatchCodes.EmbeddedActivityUpdate,
      data: {
        channel_id: channelId,
        connections: [{
          user_id: user.discord.id,
          metadata: { is_eligible_to_host: true },
        }],
        embedded_activity: app,
        guild_id: guildId,
        update_code: 2, // TODO: Document?
        users: [user.discord],
      },
    });

    res.sendStatus(204);
  },
};
