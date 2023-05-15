/* eslint-disable camelcase */
import { RemoteCommandSchema } from "@reflectcord/common/sparkle";
import { SessionManager } from "../managers";
import { WebSocket } from "../Socket";
import { Payload } from "../util";
import { invokeOPCode } from "../events";

export async function RemoteCommand(this: WebSocket, data: Payload<RemoteCommandSchema>) {
  const { target_session_id, payload } = data.d!;

  const session = SessionManager.getSession(target_session_id);
  if (!session) return;

  await invokeOPCode.call(session, payload);
}
