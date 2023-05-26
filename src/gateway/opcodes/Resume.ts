/* eslint-disable no-plusplus */
import { GatewayDispatchEvents } from "discord.js";
import { ResumeSchema } from "@reflectcord/common/sparkle";
import { Logger } from "@reflectcord/common/utils";
import {
  Payload, invalidateSession, Send, Dispatch,
} from "../util";
import { WebSocket } from "../Socket";
import { check } from "./instanceOf";
import { SessionManager } from "../managers";

export async function onResume(this: WebSocket, data: Payload<ResumeSchema>) {
  check.call(this, ResumeSchema, data.d);

  const reqData = data.d!;

  // HACK: Discord.js attempts to resume with null sequence
  if (!reqData.seq) return invalidateSession(this, false);

  this.token = reqData.token;

  const result = await SessionManager.reconnect(reqData.session_id, this);

  if (!result) return invalidateSession(this, false);

  await Dispatch(this, GatewayDispatchEvents.Resumed, null);

  if (this.pendingMessages) {
    this.trace.startTrace("dispatch_pending");
    // TODO: respect sequences, and maybe don't emit events that screw with state
    await Promise.all(this.pendingMessages.map(async (x, i) => {
      await Send(this, x);
    }));
    this.trace.stopTrace("dispatch_pending");

    delete this.pendingMessages;
  }

  Logger.log(`OK: Sent all messages to ${this.session_id}`);
}
