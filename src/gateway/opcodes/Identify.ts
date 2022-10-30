/* eslint-disable no-plusplus */
import { GatewayCloseCodes } from "discord.js";
import { startListener } from "../util/Listener";
import { Payload } from "../util";
import { WebSocket } from "../Socket";
import { Logger } from "../../common/utils";
import { check } from "./instanceOf";
import { IdentifySchema } from "../../common/sparkle";

export async function onIdentify(this: WebSocket, data: Payload) {
  clearTimeout(this.readyTimeout);
  // check.call(this, IdentifySchema, data.d);

  Logger.log("Identifying");

  const identify = data.d;

  const { token } = identify;

  if (!token) {
    Logger.error(`Invalid token ${token}`);
    return this.close(GatewayCloseCodes.AuthenticationFailed);
  }

  await startListener.call(this, token);

  await this.rvClient.loginBot(token).catch(() => {
    Logger.error("Revolt failed authentication");
    return this.close(GatewayCloseCodes.AuthenticationFailed);
  });

  // HACK!
  this.rvClient.api = this.rvAPI;
}
