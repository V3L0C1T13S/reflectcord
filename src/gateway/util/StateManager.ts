import { Logger } from "@reflectcord/common/utils";
import { WebSocket } from "../Socket";

export class UserState {
  sessions: Map<string, WebSocket> = new Map();
  token: string;

  constructor(token: string) {
    this.token = token;
  }
}

export namespace StateManager {
  export const states: Map<string, UserState> = new Map();
  // eslint-disable-next-line no-undef
  export const tasks: Map<string, NodeJS.Timeout> = new Map();
  export const deleteTime = 30 * 1000;

  export function insert(state: WebSocket) {
    const userStates = states.get(state.user_id)
      ?? states.set(state.user_id, new UserState(
        typeof state.rvClient.session === "string"
          ? state.rvClient.session : state.rvClient.session!.token,
      ))
        .get(state.user_id);

    Logger.log(`inserting state ${state}`);
    userStates?.sessions.set(state.session_id, state);
  }

  export function fetch(userId: string, sessionId: string) {
    return states.get(userId)?.sessions.get(sessionId);
  }

  export function fetchByToken(token: string, sessionId: string) {
    return Array.from(states.values())
      .find((x) => x.token === token)
      ?.sessions.get(sessionId);
  }

  export function removeUser(userId: string) {
    states.delete(userId);
  }

  export function remove(userId: string, sessionId: string) {
    const userStates = states.get(userId);
    if (!userStates) return;

    userStates.sessions.delete(sessionId);

    if (userStates.sessions.size < 1) removeUser(userId);
  }

  // eslint-disable-next-line no-inner-declarations
  function futureCleanup(state: WebSocket) {
    remove(state.user_id, state.session_id);
  }

  export function scheduleDelete(state: WebSocket) {
    tasks.set(state.session_id, setTimeout(() => {
      futureCleanup(state);
    }, deleteTime));
  }

  export function unscheduleDelete(sessionId: string) {
    const task = tasks.get(sessionId);
    clearTimeout(task);
    tasks.delete(sessionId);
  }
}
