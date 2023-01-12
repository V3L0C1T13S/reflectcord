import { GatewayDispatchEvents, GatewayOpcodes } from "discord.js";
import { WebSocket } from "ws";
import { TestingToken } from "@reflectcord/common/rvapi";
import { GatewayDispatchCodes } from "@reflectcord/common/sparkle";

const socket = new WebSocket("ws://localhost:3002?v=9&encoding=json");

socket.onopen = () => {
  console.log("connected");
};

socket.onmessage = (data) => {
  console.log("got data", data.data);

  const d = JSON.parse(data.data as string) as unknown as { op: number, t?: string };

  switch (d.op) {
    case 10: {
      console.log("gw is awaiting auth");
      socket.send(Buffer.from(JSON.stringify({
        op: GatewayOpcodes.Identify,
        d: { token: TestingToken },
      })));
      break;
    }
    case GatewayOpcodes.Dispatch: {
      switch (d.t!) {
        case GatewayDispatchEvents.Ready: {
          console.log("GW Authenticated.");
          break;
        }
        case GatewayDispatchCodes.ReadySupplemental: {
          console.log("Supplemental received");
          break;
        }
        default: {
          console.log(d.t);
          break;
        }
      }
      break;
    }
    default:
  }
};
