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

import { Channel } from "amqplib";
import EventEmitter from "events";
import { RabbitMQ } from "./utils";

export const events = new EventEmitter();

export interface eventOpts {
  user_id?: string,
  channel_id?: string,
  guild_id?: string,
  event: string,
  data: any,
  acknowledge?: Function,
}

export async function emitEvent(data: eventOpts) {
  const id = (data.channel_id || data.user_id || data.guild_id) as string;
  if (!id) return console.error("event doesn't contain any id", data);

  if (RabbitMQ.connection) {
    const payload = typeof data.data === "object" ? JSON.stringify(data.data) : data.data; // use rabbitmq for event transmission
    await RabbitMQ.channel?.assertExchange(id, "fanout", { durable: false });

    // assertQueue isn't needed, because a queue will automatically created if it doesn't exist
    const successful = RabbitMQ.channel?.publish(id, "", Buffer.from(`${payload}`), { type: data.event });
    if (!successful) throw new Error("failed to send event");
  } else {
    events.emit(id, data);
  }
}

export async function initEvent() {
  await RabbitMQ.init(); // does nothing if rabbitmq is not setup
  if (RabbitMQ.connection) {
    return;
  }
  // use event emitter
  // use process messages
}

export interface EventOptsCB extends eventOpts {
  acknowledge?: Function;
  channel?: Channel;
  cancel: Function;
}

export interface ListenEventOpts {
  channel?: Channel;
  acknowledge?: boolean;
}

async function rabbitListen(
  channel: Channel,
  id: string,
  callback: (event: EventOptsCB) => any,
  opts?: { acknowledge?: boolean },
) {
  await channel.assertExchange(id, "fanout", { durable: false });
  const q = await channel.assertQueue("", { exclusive: true, autoDelete: true });

  const cancel = () => {
    channel.cancel(q.queue);
    channel.unbindQueue(q.queue, id, "");
  };

  channel.bindQueue(q.queue, id, "");
  channel.consume(
    q.queue,
    // eslint-disable-next-line @typescript-eslint/no-shadow
    (opts) => {
      if (!opts) return;

      const data = JSON.parse(opts.content.toString());
      const event = opts.properties.type as string;

      callback({
        event,
        data,
        acknowledge() {
          channel.ack(opts);
        },
        channel,
        cancel,
      });
      // rabbitCh.ack(opts);
    },
    {
      noAck: !opts?.acknowledge,
    },
  );

  return cancel;
}

export async function listenEvent(
  event: string,
  callback: (event: EventOptsCB) => any,
  opts?: ListenEventOpts,
) {
  if (RabbitMQ.connection) {
    return rabbitListen(
      // @ts-ignore
      opts?.channel || RabbitMQ.channel,
      event,
      callback,
      { acknowledge: opts?.acknowledge },
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-shadow, no-use-before-define
  const listener = (opts: any) => callback({ ...opts, cancel });
  const cancel = () => {
    events.removeListener(event, listener);
    events.setMaxListeners(events.getMaxListeners() - 1);
  };
  events.setMaxListeners(events.getMaxListeners() + 1);
  events.addListener(event, listener);

  return cancel;
}
