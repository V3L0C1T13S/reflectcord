import { Client } from "revolt.js";

export type socketConnection = {
  reflectcordSession: string,
  revoltClient: Client,
}

export class WSManager {
  connections: socketConnection[] = [];
}

export const WSManagerSingleton = new WSManager();
