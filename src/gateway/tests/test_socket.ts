/* eslint-disable camelcase */
/* eslint-disable no-bitwise */
/**
 * Simple test websocket client
 * NOTE: This client should not be used in an automated way.
 * It will never disconnect unless an error occurs.
 *
 * NOTE: This test client is intended for user accounts.
 * Bot accounts are not supported. Instead, you should use another test
 * such as the Discord.js test suite.
*/

import { BitField, GatewayDispatchEvents, GatewayOpcodes } from "discord.js";
import { WebSocket } from "ws";
import { TestingToken } from "@reflectcord/common/rvapi";
import { ClientCapabilities, GatewayDispatchCodes } from "@reflectcord/common/sparkle";
import { isAGuild, isAGuildV2 } from "@reflectcord/common/utils/testUtils/validation";

const gatewayDomain = "gateway.discord.gg";
const socket = new WebSocket(`wss://${gatewayDomain}?v=9&encoding=json`);

const discordClientCapabilities = 4093;
const openCordCapabilities = 93;
const discordMobileCapabilities = 351;
const randomCapabilities = new BitField();
randomCapabilities.add(ClientCapabilities.DeduplicateUserObjects);

const identifyPayload = {
  token: TestingToken,
  capabilities: randomCapabilities.toJSON(),
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

          const {
            users, user_settings, presences, merged_presences, merged_members, user_settings_proto,
          } = d.d!;

          if (identifyPayload.capabilities & ClientCapabilities.DeduplicateUserObjects) {
            if (!Array.isArray(users)) throw new Error(`bad payload! expected users to be an array but we got ${users}`);
            if (!Array.isArray(merged_members)) throw new Error(`merged_members should be an array but its ${merged_members}`);
            if (!merged_presences) throw new Error(`expected merged_presences to be defined but we got ${merged_presences}`);
            if (presences) console.warn(`nonfatal payload inaccuracy! presences shouldn't be here but it was defined as ${presences}`);
          } else {
            if (!Array.isArray(presences)) throw new Error(`bad payload! expected presences to be array but its defined as ${presences}`);
            if (users) console.warn(`nonfatal payload inaccuracy! users ${users} shouldn't be present but it is!`);
            if (merged_members) console.warn(`nonfatal inaccuracy! merged_members is not supposed to be sent! ${merged_members}`);
            if (merged_presences) console.warn(`nonfatal inaccuracy! merged_presences isnt supposed to be here but its defined as ${merged_presences}`);
          }

          if (identifyPayload.capabilities & ClientCapabilities.UserSettingsProto) {
            if (user_settings) throw new Error(`fatal payload inaccuracy! we got ${user_settings} but we only want protobufs!`);
          } else if (!user_settings) throw new Error(`fatal payload inaccuracy! we didn't get user_settings even though we don't support protobufs! got ${user_settings} instead.`);
          if (!user_settings_proto) throw new Error(`fatal payload inaccuracy! some clients may expect a settings proto even without capabilities for it! got ${user_settings_proto}`);

          const testguild = d.d!.guilds[0];
          if (testguild) {
            if (!testguild.properties) {
              console.log("we got a legacy guild");
              if (identifyPayload.capabilities & ClientCapabilities.ClientStateV2) {
                throw new Error(`expected a state v2 guild but we got a legacy guild! ${testguild}`);
              }
              if (!isAGuild(testguild)) throw new Error(`bad guild!! ${testguild}`);
            } else {
              console.log("we got a state V2 guild");
              if (!(identifyPayload.capabilities & ClientCapabilities.ClientStateV2)) {
                throw new Error(`expected a legacy guild but we got a state v2 guild! ${testguild}`);
              }
              if (!isAGuildV2(testguild)) throw new Error(`bad guild v2!! ${testguild}`);
            }
          }
          break;
        }
        case GatewayDispatchCodes.ReadySupplemental: {
          console.log("Supplemental received");
          break;
        }
        case GatewayDispatchCodes.UserSettingsUpdate: {
          if (identifyPayload.capabilities & ClientCapabilities.UserSettingsProto) {
            throw new Error("potentially fatal inconsistency! got JSON settings update but client only wants protobufs! THIS CAN MESS WITH STATE IN SOME DISCORD CLIENTS!!");
          }
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
