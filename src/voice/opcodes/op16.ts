import { Send, WebSocket } from "../util";

// FIXME: WTF IS THIS FOR???
export async function HandleOp16(this: WebSocket, data: any) {
  await Send(this, {
    op: 16,
    d: {
      voice: "0.8.49",
      rtc_worker: "0.3.30",
    },
  });
}
