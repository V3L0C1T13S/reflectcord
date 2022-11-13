import { WebSocket } from "./WebSocket";

export function Send(socket: WebSocket, data: any) {
  const buffer = JSON.stringify(data);

  return new Promise((res, rej) => {
    if (socket.readyState !== 1) {
      // eslint-disable-next-line no-promise-executor-return, prefer-promise-reject-errors
      return rej("socket not open");
    }
    socket.send(buffer, (err: any) => {
      if (err) return rej(err);
      return res(null);
    });
  });
}
