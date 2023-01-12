import { Logger } from "../../common/utils";
import { WebSocket } from "../Socket";
import { RabbitMQ } from "../../common/utils/RabbitMQ";

export async function Close(this: WebSocket, code: number, reason: string) {
  Logger.log(`WS Closed ${code} ${reason}`);
  if (this.heartbeatTimeout) clearTimeout(this.heartbeatTimeout);
  if (this.readyTimeout) clearTimeout(this.readyTimeout);
  this.deflate?.close();
  this.inflate?.close();
  this.removeAllListeners();

  if (this.typingConsumer) await RabbitMQ.channel?.cancel(this.typingConsumer.consumerTag);

  // Getting out of revolt
  this.rvClient.removeAllListeners();
  await this.rvClient.logout(true);
  Logger.log("Logged out of revolt");
}
