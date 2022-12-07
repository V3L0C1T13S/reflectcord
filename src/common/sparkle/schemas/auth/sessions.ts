export interface SessionClientInfo {
  os: string;
  platform: string;
  location: string;
}

export interface UserSession {
  id_hash: string;
  approx_last_used_time: string;
  client_info: SessionClientInfo;
}

export interface SessionsResponse {
  user_sessions: UserSession[];
}
