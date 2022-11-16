import erlpack from "erlpack";
import { WebSocket } from "../Socket";
import { Payload } from "./Constants";

export async function Send(socket: WebSocket, data: Payload) {
  if (socket.encoding !== "etf" && socket.encoding !== "json") return;

  const buffer = socket.encoding === "etf" ? erlpack.pack(data) : JSON.stringify(data);

  // FIXME: Compression is unsupported
  if (socket.deflate) {
    socket.deflate.write(buffer);
    socket.deflate.flush();
    return;
  }

  return new Promise((res, rej) => {
    if (socket.readyState !== 1) {
      // eslint-disable-next-line no-promise-executor-return, prefer-promise-reject-errors
      return rej("socket not open");
    }
    socket.send(buffer, (err: any) => {
      if (err) return rej(err);
      // if (data.s) socket.state.store.push(data);
      return res(null);
    });
  });
}
