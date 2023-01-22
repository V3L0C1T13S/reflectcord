import { emitEvent } from "@reflectcord/common/Events";
import { GatewayDispatchEvents } from "discord.js";
import { ChannelContainer, ServerContainer } from "@reflectcord/common/managers";
import { WebSocket } from "../../../util/WebSocket";

export async function updateVoiceState(
  this: WebSocket,
  user: string,
  channel: ChannelContainer,
  state: {
    audio: boolean,
  },
  server?: ServerContainer | null,
) {
  const rvUser = await this.rvAPIWrapper.users.fetch(user);

  const member = await server?.extra?.members.fetch(server.revolt._id, rvUser.revolt._id)
    .catch(console.error);

  await emitEvent({
    user_id: this.rv_user_id,
    event: GatewayDispatchEvents.VoiceStateUpdate,
    data: {
      channel_id: channel.discord.id,
      guild_id: "guild_id" in channel.discord ? channel.discord.guild_id : null,
      member: member?.discord,
      mute: false,
      deaf: false,
      self_mute: !state.audio,
      self_deaf: false,
      self_video: false,
      suppress: false,
      user_id: rvUser.discord.id,
    },
  });
}
