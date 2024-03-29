/*
  Fosscord: A FOSS re-implementation and extension of the Discord.com backend.
  Copyright (C) 2023 Fosscord and Fosscord Contributors

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published
  by the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import {
  APIGuildMember,
  ChannelType,
  GatewayDispatchEvents,
} from "discord.js";
import {
  fromSnowflake, Member, tryFromSnowflake,
} from "@reflectcord/common/models";
import { VoiceStateSchema, GatewayDispatchCodes, VoiceStateUpdate } from "@reflectcord/common/sparkle";
import { reflectcordVoiceURL } from "@reflectcord/common/constants";
import { emitEvent } from "@reflectcord/common/Events";
import { VoiceState } from "@reflectcord/common/mongoose";
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

const findExistingStates = (channel_id: string) => VoiceState.find({ channel_id });

export async function VSUpdate(this: WebSocket, data: Payload<VoiceStateUpdate>) {
  check.call(this, VoiceStateSchema, data.d);
  const {
    self_mute, self_deaf, self_video, guild_id, channel_id,
  } = data.d!;

  this.voiceInfo = {
    self_mute: self_mute ?? false,
    self_deaf: self_deaf ?? false,
    self_video: self_video ?? false,
    guild_id,
    channel_id,
  };

  let onlySettingsChanged = false;

  const stateData = await VoiceState.findOneAndUpdate({
    _id: this.user_id,
  }, {
    $set: {
      deaf: false,
      mute: false,
      self_mute: this.voiceInfo.self_mute,
      self_deaf: this.voiceInfo.self_deaf,
      self_video: this.voiceInfo.self_video,
      suppress: false,
      request_to_speak_timestamp: null,
    },
    $setOnInsert: {
      _id: this.user_id,
      user_id: this.user_id,
    },
  }, { upsert: true, returnDocument: "after" });

  if (!stateData) throw new Error("Invalid state");

  if (stateData.session_id !== this.session_id) {
    // New connection
  } else if (stateData.channel_id === channel_id) onlySettingsChanged = true;

  // Leave current guild channel before connecting to a new one
  if (stateData.guild_id !== guild_id && stateData.session_id === this.session_id) {
    await emitEvent({
      event: GatewayDispatchEvents.VoiceStateUpdate,
      data: { ...stateData.toObject(), channel_id: null },
      guild_id: (await tryFromSnowflake(stateData.guild_id!))?.toString(), // TODO: Types
    });
    // Tell DM/group chats we're leaving
  } else if (stateData.channel_id && !channel_id && stateData.session_id === this.session_id) {
    const existing = await findExistingStates(stateData.channel_id);

    const rvChannelId = await fromSnowflake(stateData.channel_id);

    await emitEvent({
      event: GatewayDispatchEvents.VoiceStateUpdate,
      data: { ...stateData.toObject(), channel_id: null },
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
  if (guild_id) stateData.guild_id = guild_id; // @ts-ignore
  else delete stateData.guild_id;

  if (guild_id) {
    const serverId = await fromSnowflake(guild_id);
    const member = await this.rvAPI.get(`/servers/${serverId as ""}/members/${this.rv_user_id as ""}`);
    const selfUser = await this.rvAPIWrapper.users.fetch(this.rv_user_id);

    const discordMember = await Member.from_quark(member, { discordUser: selfUser.discord });

    stateData.member = discordMember;
  } else delete stateData.member;

  await stateData.save();

  if (stateData.guild_id || stateData.channel_id) {
    await emitEvent({
      event: GatewayDispatchEvents.VoiceStateUpdate,
      data: stateData.toObject(),
      guild_id: (await tryFromSnowflake(stateData.guild_id!))?.toString(), // TODO: Types
      channel_id: (await tryFromSnowflake(stateData.channel_id!))?.toString(), // TODO: Types
    });
  } else {
    await emitEvent({
      event: GatewayDispatchEvents.VoiceStateUpdate,
      data: stateData.toObject(),
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
