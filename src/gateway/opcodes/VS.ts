/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import {
  APIGuildMember,
  GatewayDispatchEvents,
  GatewayOpcodes,
} from "discord.js";
import { DbManager } from "../../common/db";
import { fromSnowflake, toSnowflake } from "../../common/models/util";
import { VoiceStateSchema } from "../../common/sparkle";
import { WebSocket } from "../Socket";
import { Payload, Send } from "../util";
import { check } from "./instanceOf";
import { Member } from "../../common/models";

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

  const state = await voiceStates.findOneAndUpdate({
    user_id: this.user_id,
    session_id: this.session_id,
  }, {
    $setOnInsert: {
      user_id: this.user_id,
      session_id: this.session_id,
    },
    $set: {
      self_mute,
      self_deaf,
      self_video,
      guild_id,
      channel_id,
    },
  }, { upsert: true });

  if (channel_id) {
    const rvChannelId = await fromSnowflake(channel_id);
    const voiceData = await this.rvAPI.post(`/channels/${rvChannelId as ""}/join_call`);

    const user_id = await fromSnowflake(this.user_id);

    const stateObject: VoiceStateObject = {
      guild_id,
      channel_id,
      user_id: await toSnowflake(user_id),
      session_id: this.session_id,
      deaf: false,
      mute: false,
      self_deaf: this.voiceInfo.self_deaf,
      self_mute: this.voiceInfo.self_mute,
      self_video: false,
      supress: false,
      request_to_speak_timestamp: null,
    };

    if (guild_id) {
      const serverId = await fromSnowflake(guild_id);
      const member = await this.rvAPI.get(`/servers/${serverId as ""}/members/${user_id as ""}`);

      stateObject.member = await Member.from_quark(member);
    }

    await Send(this, {
      op: GatewayOpcodes.Dispatch,
      t: GatewayDispatchEvents.VoiceStateUpdate,
      s: this.sequence++,
      d: stateObject,
    });

    await Send(this, {
      op: GatewayOpcodes.Dispatch,
      t: GatewayDispatchEvents.VoiceServerUpdate,
      s: this.sequence++,
      d: {
        token: this.rvClient.session,
        guild_id,
        endpoint: "127.0.0.1:3015/voice",
      },
    });
  }
}
