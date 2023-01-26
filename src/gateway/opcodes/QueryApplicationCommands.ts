/* eslint-disable no-plusplus */
import { GatewayDispatchCodes } from "@reflectcord/common/sparkle";
import { Payload, Dispatch } from "../util";
import { WebSocket } from "../Socket";

// STUB
export async function QueryApplicationCommands(this: WebSocket, data: Payload) {
  const appData = data.d;

  await Dispatch(this, GatewayDispatchCodes.GuildApplicationCommandsUpdate, {
    updated_at: 1630271377245,
    nonce: appData["nonce"] ?? "",
    guild_id: appData["guild_id"] ?? "",
    applications: [],
    application_commands: [],
  });
}
