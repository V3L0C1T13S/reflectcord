/* eslint-disable camelcase */
import { RemoteCommandSchema } from "@reflectcord/common/sparkle";
import { Logger } from "@reflectcord/common/utils";
import { SessionManager } from "../managers";
import { WebSocket } from "../Socket";
import { Payload } from "../util";

export async function RemoteCommand(this: WebSocket, data: Payload<RemoteCommandSchema>) {
  const { target_session_id, payload } = data.d!;

  const session = SessionManager.getSession(target_session_id);
  if (!session || session.rv_user_id !== this.rv_user_id) return;

  switch (payload.type) {
    default: {
      Logger.debug("Unhandled remote command:", payload.type);

      break;
    }
  }
}
