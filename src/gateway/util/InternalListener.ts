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

import { eventOpts, listenEvent } from "@reflectcord/common/Events";
import { Logger, RabbitMQ } from "@reflectcord/common/utils";
import { GatewayDispatchCodes } from "@reflectcord/common/sparkle";
import { fromSnowflake, toSnowflake } from "@reflectcord/common/models";
import { GatewayDispatchEvents } from "discord.js";
import { WebSocket } from "../Socket";
import { Dispatch } from "./send";

async function internalConsumer(this: WebSocket, opts: eventOpts) {
  try {
    const { data, event } = opts;
    const id = data.id as string;

    Logger.log(`got event ${event} with data ${JSON.stringify(data)}`);

    const consumer = internalConsumer.bind(this);

    opts.acknowledge?.();

    switch (event) {
      case GatewayDispatchCodes.VoiceChannelEffectSend: {
        // TODO: Compare against real Discord to see if this is correct
        if (!this.voiceInfo.channel_id === data.channel_id) return;

        const channel = this.rvAPIWrapper.channels.get(await fromSnowflake(data.channel_id));
        if (channel && ("server" in channel.revolt) && channel.revolt.server) {
          data.guild_id = await toSnowflake(channel.revolt.server);
        }

        break;
      }
      case GatewayDispatchEvents.InviteCreate: {
        const user = await this.rvAPIWrapper.users.fetch(await fromSnowflake(data.inviter.id));

        data.inviter = user.discord;

        break;
      }
      case "INTERNAL_START_TYPING": {
        if (data.token !== this.token) return;

        await this.rvClient.websocket.send({
          type: "BeginTyping",
          channel: data.channel,
        });

        return;
      }
      default: {
        break;
      }
    }

    await Dispatch(this, event, data);
  } catch (e) {
    console.error("Error in consumer:", e);
  }
}

export async function createInternalListener(this: WebSocket) {
  const consumer = internalConsumer.bind(this);

  const opts: { acknowledge: boolean; channel?: any } = {
    acknowledge: true,
  };
  if (RabbitMQ.connection) {
    opts.channel = await RabbitMQ.connection.createChannel();
    // @ts-ignore
    opts.channel.queues = {};
  }

  this.events[this.rv_user_id] = await listenEvent(this.rv_user_id, consumer, opts);
  this.rvAPIWrapper.servers.forEach(async (server) => {
    this.events[server.revolt._id] = await listenEvent(server.revolt._id, consumer, opts);

    server.revolt.channels.forEach(async (channel) => {
      this.events[channel] = await listenEvent(channel, consumer, opts);
    });
  });
  this.rvAPIWrapper.channels.forEach(async (channel) => {
    if (this.events[channel.revolt._id]) return;

    this.events[channel.revolt._id] = await listenEvent(channel.revolt._id, consumer, opts);
  });

  this.once("close", async () => {
    if (opts.channel) await opts.channel.close().catch(Logger.error);
    else {
      Object.values(this.events).forEach((x) => x());
      Object.values(this.member_events).forEach((x) => x());
    }
  });
}
