import { WebSocket } from "../util";
import { vortexHandlers } from "./vortex";
import { standaloneHandlers } from "./standalone";

export type OPCodeHandler = (this: WebSocket, data: any) => any;

export type OPCodeList = Record<number, OPCodeHandler>;

export const VoiceBackends: Record<string, OPCodeList> = {
  vortex: vortexHandlers,
  standalone: standaloneHandlers,
};
