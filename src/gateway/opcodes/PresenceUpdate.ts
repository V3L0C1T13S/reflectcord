import { Payload, Send } from "../util";
import { WebSocket } from "../Socket";

export async function presenceUpdate(this: WebSocket, data: Payload) {
  // FIXME: Make this better/use quarkconversion

  await this.rvClient.user?.update({
    status: {
      text: data.d.activities[0]?.name,
    },
  });
}
