import { WebSocket } from "../Socket";

export namespace SessionManager {
  const connections = new Map<string, WebSocket>();

  export function addSession(socket: WebSocket) {
    connections.set(socket.session_id, socket);
  }

  export function removeSession(id: string) {
    connections.delete(id);
  }

  export function getSession(id: string) {
    return connections.get(id);
  }
}
