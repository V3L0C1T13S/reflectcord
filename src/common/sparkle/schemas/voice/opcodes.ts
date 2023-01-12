export enum VoiceOPCodes {
  // CLIENT
  Identify = 0,
  SelectProtocol = 1,
  Heartbeat = 3,
  Resume = 7,
  // SERVER
  Ready = 2,
  SessionDescription = 4,
  HeartbeatAck = 6,
  Hello = 8,
  Resumed = 9,
  ClientDisconnect = 13,
  MediaSinkWants = 15,
  ChannelOptionsUpdate = 17,
  // BOTH
  Speaking = 5,
  Video = 12,
  VoiceBackendVersion = 16,
}

export enum VoiceCloseCodes {

}
