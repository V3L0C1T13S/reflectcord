export enum RemoteCommandPayloadType {
  VoiceStateUpdate = "VOICE_STATE_UPDATE",
  Disconnect = "DISCONNECT"
}

export interface RemoteCommandBasePayload {
  type: RemoteCommandPayloadType
}

export interface RemoteCommandVoiceStateUpdatePayload extends RemoteCommandBasePayload {
  self_mute: boolean,
  self_deaf: boolean,
  type: RemoteCommandPayloadType.VoiceStateUpdate,
}

export interface RemoteCommandDisconnectPayload extends RemoteCommandBasePayload {
  type: RemoteCommandPayloadType.Disconnect
}

export interface BaseRemoteCommand {
  target_session_id: string,
  payload: RemoteCommandBasePayload,
}

export interface RemoteCommandVoiceStateUpdate extends BaseRemoteCommand {
  payload: RemoteCommandVoiceStateUpdatePayload,
}

export interface RemoteCommandDisconnect extends BaseRemoteCommand {
  payload: RemoteCommandDisconnectPayload,
}

export type RemoteCommandSchema = RemoteCommandVoiceStateUpdate | RemoteCommandDisconnect;
