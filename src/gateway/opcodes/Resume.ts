/* eslint-disable no-plusplus */
import { GatewayOpcodes, GatewayDispatchEvents } from "discord.js";
import {
  Payload, StateManager, invalidateSession, Send,
} from "../util";
import { WebSocket } from "../Socket";
import { check } from "./instanceOf";
import { ResumeSchema } from "../../common/sparkle";

async function resume(this: WebSocket, startAt: number) {
  await Promise.all(this.state.store.map(async (x, i) => {
    if (i > startAt) return;

    await Send(this, x);
  }));

  await Send(this, {
    op: GatewayOpcodes.Dispatch,
    t: GatewayDispatchEvents.Resumed,
    s: this.sequence++,
    d: {},
  });
}

export async function onResume(this: WebSocket, data: Payload<ResumeSchema>) {
  check.call(this, ResumeSchema, data.d);

  const reqData = data.d!;

  // HACK: Discord.js attempts to resume with null sequence
  if (!reqData.seq) return invalidateSession(this, false);

  const state = StateManager.fetchByToken(reqData.token, reqData.session_id);
  if (!state) return invalidateSession(this, false);

  if (reqData.seq > state.sequence) return invalidateSession(this, false);

  if (!state.CLOSED) return invalidateSession(this, false);

  StateManager.unscheduleDelete(state.session_id);
  this.sequence = state.sequence;
  // Getting rid of old state
  StateManager.insert(this);

  await resume.call(this, this.sequence - reqData.seq);
}
