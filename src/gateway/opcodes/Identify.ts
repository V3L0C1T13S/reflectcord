/* eslint-disable no-plusplus */
import { GatewayCloseCodes } from "discord.js";
import { Logger } from "@reflectcord/common/utils";
import { IdentifySchema } from "@reflectcord/common/sparkle";
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

  if (!token) {
    Logger.error(`Invalid token ${token}`);
    return this.close(GatewayCloseCodes.AuthenticationFailed);
  }

  if (token.startsWith("Bot ")) {
    token = token.slice("Bot ".length, token.length);
  }

  this.token = token;

  await startListener.call(this, token, identify);

  await this.rvClient.loginBot(token).catch(() => {
    Logger.error("Revolt failed authentication");
    return this.close(GatewayCloseCodes.AuthenticationFailed);
  });

  // HACK!
  this.rvClient.api = this.rvAPI;

  // StateManager.insert(this);
}
