/* eslint-disable no-param-reassign */
import { Logger, RabbitMQ } from "@reflectcord/common/utils";
import { startListener } from "../util/Listener";
import { WebSocket } from "../Socket";
import { createInternalListener } from "../util/InternalListener";

export namespace SessionManager {
  const connections = new Map<string, WebSocket>();
  const deleteTime = 30 * 1000;
  // eslint-disable-next-line no-undef
  const tasks: Map<string, NodeJS.Timeout> = new Map();

  export function addSession(socket: WebSocket) {
    connections.set(socket.session_id, socket);
  }

  export async function cleanupSession(socket: WebSocket) {
    try {
      Logger.log(`Cleaning up ${socket.session_id}`);

      if (socket.heartbeatTimeout) clearTimeout(socket.heartbeatTimeout);
      if (socket.readyTimeout) clearTimeout(socket.readyTimeout);
      socket.deflate?.close();
      socket.inflate?.close();
      socket.removeAllListeners();

      if (socket.typingConsumer) await RabbitMQ.channel?.cancel(socket.typingConsumer.consumerTag);

      // Getting out of revolt
      socket.rvClient.removeAllListeners();
      await socket.rvClient.logout(true);

      Logger.log("Logged out of revolt");

      connections.delete(socket.session_id);
    } catch (e) {
      Logger.error(`failed to clean up ${socket.session_id}: ${e}`);
    }
  }

  export function getSession(id: string) {
    return connections.get(id);
  }

  export function getByToken(token: string) {
    return [...connections.values()].find((x) => x.token === token);
  }

  export function removeSession(id: string) {
    const session = getSession(id);
    if (!session) throw new Error(`session ${id} not found`);

    Logger.log(`Cleaning up ${id} in ${deleteTime} MS`);

    tasks.set(id, setTimeout(() => cleanupSession(session), deleteTime));
  }

  export function cancelInvalidation(id: string) {
    const task = tasks.get(id);
    clearTimeout(task);
    tasks.delete(id);
  }

  export function invalidateSession(id: string) {
    const session = getSession(id);
    if (!session) throw new Error(`session ${id} not found`);

    cancelInvalidation(id);

    return cleanupSession(session);
  }

  export async function reconnect(id: string, newSession: WebSocket) {
    const old = connections.get(id);
    if (!old) return false;
    if (old.token !== newSession.token) return false;

    cancelInvalidation(id);

    newSession.bot = old.bot;
    newSession.capabilities = old.capabilities;
    newSession.enable_lazy_channels = old.enable_lazy_channels;
    newSession.intents = old.intents;
    newSession.trace = old.trace;
    newSession.user_id = old.user_id;
    newSession.rv_user_id = old.rv_user_id;
    newSession.rvClient = old.rvClient;
    newSession.rvAPIWrapper = old.rvAPIWrapper;
    newSession.rvAPI = old.rvAPI;
    newSession.subscribed_members = old.subscribed_members;
    newSession.subscribed_servers = old.subscribed_servers;
    // TODO: is this correct?
    newSession.session_id = old.session_id;
    newSession.lazy_channels = old.lazy_channels;
    newSession.sequence = old.sequence;
    newSession.permissions = old.permissions;
    newSession.voiceInfo = old.voiceInfo;
    newSession.identifyPayload = old.identifyPayload;

    if (old.shard_count) newSession.shard_count = old.shard_count;
    if (old.shard_id) newSession.shard_id = old.shard_id;
    if (old.rvSession) newSession.rvSession = old.rvSession;
    if (old.pendingMessages) newSession.pendingMessages = old.pendingMessages;
    // TODO: resubscribe to rabbitmq events - this just stops it from memory leaking everywhere
    if (old.typingConsumer) await RabbitMQ.channel?.cancel(old.typingConsumer.consumerTag);

    if (old.heartbeatTimeout) clearTimeout(old.heartbeatTimeout);
    if (old.readyTimeout) clearTimeout(old.readyTimeout);
    if (newSession.readyTimeout) clearTimeout(newSession.readyTimeout);

    old.deflate?.close();
    old.inflate?.close();

    old.rvClient.removeAllListeners();
    old.removeAllListeners();

    await startListener.call(newSession, newSession.token);
    await createInternalListener.call(newSession);

    connections.set(id, newSession);

    return true;
  }
}
