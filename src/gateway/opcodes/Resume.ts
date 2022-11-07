import { GatewayOpcodes } from "discord.js";
import { Send, Payload } from "../util";
import { WebSocket } from "../Socket";
import { check } from "./instanceOf";
import { ResumeSchema } from "../../common/sparkle";

export async function onResume(this: WebSocket, data: Payload<ResumeSchema>) {
  check.call(this, ResumeSchema, data.d);

  const reqData = data.d!;

  // HACK: Discord.js attempts to resume with null sequence
  if (!reqData.seq) {
    await Send(this, {
      op: GatewayOpcodes.InvalidSession,
      d: false,
    });
  }

  // FIXME: Stub
  await Send(this, {
    op: GatewayOpcodes.InvalidSession,
    d: false,
  });
}
