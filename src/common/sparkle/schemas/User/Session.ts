import { internalActivity } from "../../../models";

export interface ClientInfo {
  version: number;
  client: string;
  os?: string;
}

export interface Session {
  session_id: string;
  activities: internalActivity[];
  client_info: ClientInfo;
  status: string;
}
