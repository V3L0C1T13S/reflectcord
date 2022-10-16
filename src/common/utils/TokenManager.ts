export namespace TokenManager {
  export const tokens: Map<string, string[]> = new Map();

  /**
   * Gets all the sessions for a token. Useful for bots,
   * which don't support permanent sessions.
   */
  export function getSessionsForToken(token: string) {
    return tokens.get(token);
  }

  export function pushSession(token: string, session: string) {
    const sessions = tokens.get(token);

    sessions?.push(session);
  }

  export function createSession(token: string) {
    if (tokens.get(token)) return;

    tokens.set(token, []);
  }
}
