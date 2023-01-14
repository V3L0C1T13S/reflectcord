/* eslint-disable camelcase */
import { Payload } from "@reflectcord/gateway/util";
import { emitEvent } from "@reflectcord/common/Events";
import { fromSnowflake } from "@reflectcord/common/models";
import { GatewayDispatchCodes } from "@reflectcord/common/sparkle";
import { WebSocket } from "../Socket";

// TODO: Activities
export async function ActivityClose(this: WebSocket, data: Payload) {
  const { application_id, channel_id, guild_id } = data.d;

  const rvChannelId = await fromSnowflake(channel_id);
  const rvGuildId = await fromSnowflake(guild_id);

  await emitEvent({
    guild_id: rvGuildId,
    event: GatewayDispatchCodes.EmbeddedActivityUpdate,
    data: {
      channel_id,
      connections: [],
      embedded_activity: {
        application_id,
      },
      guild_id,
      update_code: 3,
      users: [],
    },
  });
}
