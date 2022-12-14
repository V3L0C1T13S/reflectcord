/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import {
  APIGuildMember,
  GatewayDispatchEvents,
  GatewayOpcodes,
} from "discord.js";
import { DbManager } from "@reflectcord/common/db";
import {
  fromSnowflake, Member, tryFromSnowflake,
} from "@reflectcord/common/models";
import { VoiceStateSchema } from "@reflectcord/common/sparkle";
import { reflectcordVoiceURL } from "@reflectcord/common/constants";
import { emitEvent } from "@reflectcord/common/Events";
import { WebSocket } from "../Socket";
import { Payload, Send } from "../util";
import { check } from "./instanceOf";

interface VoiceStateObject {
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
const voiceStates = DbManager.client.db("reflectcord")
  .collection("voiceStates");

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

  if (stateData.guild_id !== guild_id && stateData.session_id === this.session_id) {
    await emitEvent({
      event: GatewayDispatchEvents.VoiceStateUpdate,
      data: { ...stateData, channel_id: null },
      guild_id: await tryFromSnowflake(stateData.guild_id),
    });
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
    await Send(this, {
      op: GatewayOpcodes.Dispatch,
      t: GatewayDispatchEvents.VoiceStateUpdate,
      s: this.sequence++,
      d: stateData,
    });
  }

  if (stateData.channel_id !== null && !onlySettingsChanged) {
    await emitEvent({
      event: GatewayDispatchEvents.VoiceServerUpdate,
      data: {
        token: this.token,
        guild_id,
        endpoint: reflectcordVoiceURL,
      },
      user_id: this.rv_user_id,
    });
  }
}
