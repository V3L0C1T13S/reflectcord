import { Payload } from "../util";
import { WebSocket } from "../Socket";
import { internalStatus, Status } from "../../common/models";

export async function presenceUpdate(this: WebSocket, data: Payload<internalStatus>) {
  if (!data.d) return;

  await this.rvAPI.patch("/users/@me", {
    status: await Status.to_quark(data.d) ?? null,
  });
}
