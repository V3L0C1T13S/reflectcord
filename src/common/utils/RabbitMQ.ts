import { Channel, connect, Connection } from "amqplib";
import { Logger } from "./Logger";
import { userStartTyping } from "../events/user";

export const RabbitMQ: {
  connection: Connection | null; channel: Channel | null; server: any, init: () => Promise<void>
} = {
  connection: null,
  channel: null,
  server: null,
  async init() {
    const host = "amqp://guest:guest@localhost:5672/";
    this.connection = await connect(host, {
      timeout: 1000 * 60,
    });
    Logger.log("RabbitMQ connected");
    this.channel = await this.connection.createChannel();
    Logger.log("Channel created");

    this.channel.assertQueue(userStartTyping, { durable: false });
  },
};
