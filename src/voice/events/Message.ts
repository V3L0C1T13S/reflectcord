import { voiceOPCodeHandlers } from "../opcodes";
import { Logger } from "../../common/utils";
import { WebSocket } from "../util";

export async function onMessage(this: WebSocket, buffer: Buffer) {
  try {
    const data = JSON.parse(buffer.toString());
    Logger.log(`incoming message: ${buffer.toString()}`);

    const OPCodeHandler = voiceOPCodeHandlers[data.op];
    if (!OPCodeHandler) {
    // FIXME: Close connection if all opcodes are implemented
      Logger.error(`Unknown opcode ${data.op}`);
      return;
    }

    return await OPCodeHandler.call(this, data);
  } catch (e) {
    Logger.error(`RTC: ${e}`);
  }
}
