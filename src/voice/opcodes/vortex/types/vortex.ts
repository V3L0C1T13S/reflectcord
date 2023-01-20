// https://github.com/itzTheMeow/revoice.ts/blob/8fd207e4df7df297ed5aa7dcd26d9296b4636502/src/VortexTypes.ts

export type VortexPacketType =
  | "InitializeTransports"
  | "Authenticate"
  | "ConnectTransport"
  | "StartProduce"
  | "StopProduce"
  | "UserStartProduce"
  | "UserStopProduce"
  | "StartConsume"
  | "StopConsume"
  | "UserJoined"
  | "RoomInfo"
  | "UserLeft";

export enum RevoiceState {
  OFFLINE, // not joined anywhere
  IDLE, // joined, but not playing
  BUFFERING, // joined, buffering data
  PLAYING, // joined and playing
  PAUSED, // joined and paused
  JOINING, // join process active
  UNKNOWN, // online but a Media instance is used to play audio
}
