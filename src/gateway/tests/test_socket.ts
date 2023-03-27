/**
 * Simple test websocket client
 * NOTE: This client should not be used in an automated way.
 * It will never disconnect unless an error occurs.
*/

import { GatewayDispatchEvents, GatewayOpcodes } from "discord.js";
import { WebSocket } from "ws";
import { TestingToken } from "@reflectcord/common/rvapi";
import { GatewayDispatchCodes } from "@reflectcord/common/sparkle";
import { isAGuild, isAGuildV2 } from "@reflectcord/common/utils/testUtils/validation";

const gatewayDomain = "gateway.discord.gg";
const socket = new WebSocket(`wss://${gatewayDomain}?v=9&encoding=json`);

const discordClientCapabilities = 4093;
const openCordCapabilities = 93;
const discordMobileCapabilities = 351;

const identifyPayload = {
  token: TestingToken,
  capabilities: discordMobileCapabilities,
  properties: {
    browser: "Discord Android",
    browser_user_agent: "Discord-Android/126021",
    client_build_number: 126021,
    client_version: "126.21 - Stable",
    device: "Pixel 7 Pro, cheetah",
    os: "Android",
    os_sdk_version: "33",
    os_version: "13",
    system_locale: "en-US",
  },
};

socket.onopen = () => {
  console.log("connected");
};

socket.onmessage = (data) => {
  console.log("got data", data.data);

  const d = JSON.parse(data.data as string) as unknown as { op: number, t?: string, d?: any };

  switch (d.op) {
    case GatewayOpcodes.Hello: {
      console.log("gw is awaiting auth");
      socket.send(Buffer.from(JSON.stringify({
        op: GatewayOpcodes.Identify,
        d: identifyPayload,
      })));
      break;
    }
    case GatewayOpcodes.Heartbeat: {
      socket.send(Buffer.from(JSON.stringify({
        op: GatewayOpcodes.Heartbeat,
      })));
      break;
    }
    case GatewayOpcodes.Dispatch: {
      switch (d.t!) {
        case GatewayDispatchEvents.Ready: {
          console.log("GW Authenticated.");

          const testguild = d.d!.guilds[0];
          if (testguild) {
            if (!testguild.properties) {
              console.log("we got a legacy guild");
              if (!isAGuild(testguild)) throw new Error(`bad guild!! ${testguild}`);
            } else {
              console.log("we got a state V2 guild");
              if (!isAGuildV2(testguild)) throw new Error(`bad guild v2!! ${testguild}`);
            }
          }
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
      console.log("ok we got", d.t);
      break;
    }
    default: {
      console.log("unhandled opcode", d.op);
    }
  }
};

socket.onclose = (data) => {
  console.log("Session closed. Testing complete.");
  process.exit(1);
};
