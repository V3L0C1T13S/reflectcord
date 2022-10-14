import { Payload } from "../util";
import { WebSocket } from "../Socket";

export async function presenceUpdate(this: WebSocket, data: Payload) {
  // FIXME: Make this better/use quarkconversion

  await this.rvClient.users.edit({
    status: {
      text: data.d.activities[0]?.name,
    },
  });
}
