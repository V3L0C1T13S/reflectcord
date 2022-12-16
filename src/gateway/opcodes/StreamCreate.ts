/* eslint-disable camelcase */
import { Payload } from "@reflectcord/gateway/util";
import { WebSocket } from "@reflectcord/gateway/Socket";
import { Logger } from "@reflectcord/common/utils";
import { check } from "./instanceOf";

const StreamCreateSchema = {
  type: String,
  guild_id: String,
  channel_id: String,
  $preferred_region: String,
};

// eslint-disable-next-line no-redeclare
interface StreamCreateSchema {
  type: "guild" | "channel";
  guild_id: string,
  channel_id: string,
  preferred_region: string | null | undefined,
}

export async function StreamCreate(this: WebSocket, data: Payload<StreamCreateSchema>) {
  check.call(this, StreamCreateSchema, data.d);

  const {
    type, guild_id, channel_id, preferred_region,
  } = data.d!;
}
