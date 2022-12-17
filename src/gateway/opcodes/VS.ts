/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import {
  APIGuildMember,
  ChannelType,
  GatewayDispatchEvents,
} from "discord.js";
import { DbManager } from "@reflectcord/common/db";
import {
  fromSnowflake, Member, tryFromSnowflake,
} from "@reflectcord/common/models";
import { VoiceStateSchema } from "@reflectcord/common/sparkle";
import { reflectcordVoiceURL } from "@reflectcord/common/constants";
import { emitEvent } from "@reflectcord/common/Events";
import { GatewayDispatchCodes } from "@reflectcord/common/sparkle/schemas/Gateway/Dispatch";
import { WebSocket } from "../Socket";
import { Payload } from "../util";
import { check } from "./instanceOf";

export interface VoiceStateObject {
  guild_id?: string,
  channel_id: string | null | undefined,
  user_id: string,
  member?: APIGuildMember,
  session_id: string,
  deaf: boolean,
  mute: boolean,
  self_deaf: boolean,
  self_mute: boolean,
  self_stream?: boolean,
  self_video: boolean,
  supress: boolean,
  request_to_speak_timestamp: string | null | undefined,
}

// FIXME: Implement with RPC instead
export const voiceStates = DbManager.client.db("reflectcord")
  .collection("voiceStates");

const findExistingStates = (channel_id: string) => voiceStates.find({ channel_id }).toArray();

export async function VSUpdate(this: WebSocket, data: Payload) {
  check.call(this, VoiceStateSchema, data.d);
  const {
    self_mute, self_deaf, self_video, guild_id, channel_id,
  } = data.d;

  this.voiceInfo = {
    self_mute,
    self_deaf,
    self_video,
    guild_id,
    channel_id,
  };

  let onlySettingsChanged = false;

  const stateObjectV2 = await voiceStates.findOneAndUpdate({
    user_id: this.user_id,
  }, {
    $set: {
      user_id: this.user_id,
      deaf: false,
      mute: false,
      self_mute,
      self_deaf,
      self_video,
      suppress: false,
      request_to_speak_timestamp: null,
    },
  }, { upsert: true, returnDocument: "after" });

  const stateData = stateObjectV2.value;
  if (!stateData) throw new Error("Invalid state");

  if (stateData.session_id !== this.session_id) {
    // New connection
  } else if (stateData.channel_id === channel_id) onlySettingsChanged = true;

  // Leave current guild channel before connecting to a new one
  if (stateData.guild_id !== guild_id && stateData.session_id === this.session_id) {
    await emitEvent({
      event: GatewayDispatchEvents.VoiceStateUpdate,
      data: { ...stateData, channel_id: null },
      guild_id: await tryFromSnowflake(stateData.guild_id),
    });
    // Tell DM/group chats we're leaving
  } else if (stateData.channel_id && !channel_id && stateData.session_id === this.session_id) {
    const existing = await findExistingStates(stateData.channel_id);

    const rvChannelId = await fromSnowflake(stateData.channel_id);

    await emitEvent({
      event: GatewayDispatchEvents.VoiceStateUpdate,
      data: { ...stateData, channel_id: null },
      channel_id: rvChannelId,
    });

    if ((existing.length - 1) <= 0) {
      await emitEvent({
        event: GatewayDispatchCodes.CallDelete,
        data: {
          channel_id: stateData.channel_id,
        },
        channel_id: rvChannelId,
      });
    }
  }

  stateData.session_id = this.session_id;
  stateData.channel_id = channel_id;
  stateData.guild_id = guild_id;

  if (guild_id) {
    const serverId = await fromSnowflake(guild_id);
    const member = await this.rvAPI.get(`/servers/${serverId as ""}/members/${this.rv_user_id as ""}`);
    const selfUser = await this.rvAPIWrapper.users.fetch(this.rv_user_id);

    const discordMember = await Member.from_quark(member, selfUser.revolt);

    stateData.member = discordMember;
  } else delete stateData.member;

  await voiceStates.updateOne({ user_id: this.user_id }, {
    $set: stateData,
  });

  if (stateData.guild_id || stateData.channel_id) {
    await emitEvent({
      event: GatewayDispatchEvents.VoiceStateUpdate,
      data: stateData,
      guild_id: await tryFromSnowflake(stateData.guild_id),
      channel_id: await tryFromSnowflake(stateData.channel_id),
    });
  } else {
    await emitEvent({
      event: GatewayDispatchEvents.VoiceStateUpdate,
      data: stateData,
      user_id: this.rv_user_id,
    });
  }

  if (stateData.channel_id !== null && !onlySettingsChanged) {
    const rvChannelId = await fromSnowflake(channel_id);
    const rvChannel = await this.rvAPIWrapper.channels.fetch(rvChannelId);

    await emitEvent({
      event: GatewayDispatchEvents.VoiceServerUpdate,
      data: {
        token: this.token,
        guild_id,
        endpoint: reflectcordVoiceURL,
      },
      user_id: this.rv_user_id,
    });

    if (
      rvChannel.discord.type === ChannelType.DM
      || rvChannel.discord.type === ChannelType.GroupDM
    ) {
      const existingStates = await findExistingStates(channel_id);

      if (existingStates.length === 0 || existingStates.length === 1) {
        await emitEvent({
          event: "CALL_CREATE",
          data: {
            channel_id,
            message_id: "0",
            region: "",
            ringing: [],
            voice_states: [],
          },
          channel_id: rvChannelId,
        });
      }
    }
  }
}
