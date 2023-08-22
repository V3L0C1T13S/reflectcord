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
import { GatewayCloseCodes } from "discord.js";
import { Logger } from "@reflectcord/common/utils";
import { IdentifySchema } from "@reflectcord/common/sparkle";
import { revoltApiURL } from "@reflectcord/common/constants";
import { RevoltSession } from "@reflectcord/common/mongoose";
import { identifyClient } from "@reflectcord/common/models";
import { startListener } from "../util/Listener";
import { Payload } from "../util";
import { WebSocket } from "../Socket";
import { check } from "./instanceOf";

export async function onIdentify(this: WebSocket, data: Payload<IdentifySchema>) {
  clearTimeout(this.readyTimeout);
  check.call(this, IdentifySchema, data.d);

  Logger.log("Identifying");

  const identify = data.d!;

  let { token } = identify;
  const { shard, intents } = identify;

  if (token.startsWith("Bot ")) {
    token = token.slice("Bot ".length, token.length);
  }

  this.token = token;

  this.identifyPayload = identify;

  if (shard) {
    [this.shard_id, this.shard_count] = shard;

    if (
      this.shard_count == null
      || this.shard_id == null
      || this.shard_id > this.shard_count
      || this.shard_id < 0
      || this.shard_count <= 0
    ) {
      return this.close(GatewayCloseCodes.InvalidShard);
    }
  }

  this.intents = intents;

  this.clientInfo = {
    client: identifyClient(this.identifyPayload.properties?.browser ?? "Unknown"),
  };

  await startListener.call(this, token);

  this.trace.startTrace("get_session");
  const existingSession = await RevoltSession.findOne({ token });
  this.trace.stopTrace("get_session");

  const revoltTrace = this.trace.createTrace(new URL(revoltApiURL).host);
  revoltTrace.createCall("bonfire_authenticate").start();
  // We can take a shortcut straight into user mode if we know
  // that the session exists.
  if (existingSession) {
    this.rvSession = existingSession;
    await this.rvClient.useExistingSession(existingSession.toJSON())
      .catch(() => this.close(GatewayCloseCodes.AuthenticationFailed));
  } else {
    await this.rvClient.loginBot(token).catch(() => {
      Logger.error("Revolt failed authentication");
      return this.close(GatewayCloseCodes.AuthenticationFailed);
    });
  }
  revoltTrace.stopCall("bonfire_authenticate");

  // HACK!
  // @ts-ignore
  this.rvClient.api = this.rvAPI;

  // StateManager.insert(this);
}
