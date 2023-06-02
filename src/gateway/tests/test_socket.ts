/* eslint-disable no-console */
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

import { BitField, GatewayDispatchEvents, IntentsBitField } from "discord.js";
import { WebSocket } from "ws";
import { TestingToken } from "@reflectcord/common/rvapi";
import {
  ClientCapabilities,
  GatewayDispatchCodes,
  ReadyData,
  ReadySupplementalData,
  GatewayOpcodes,
  GatewayLazyRequestDispatchData,
  LazyOperatorSync,
} from "@reflectcord/common/sparkle";
import { isAGuild, isAGuildV2 } from "@reflectcord/common/utils/testUtils/validation";
import { createWriteStream } from "fs";

const USE_DISCORD = true;
const { DUMP_EVENTS } = process.env;

const gatewayDomain = USE_DISCORD ? "wss://gateway.discord.gg?v=9&encoding=json" : "ws://localhost:3002?v=9&encoding=json";
const socket = new WebSocket(gatewayDomain);

const stream = createWriteStream("./gw_dumps/gw_dump.json");
const writeToDump = (chunk: any) => (DUMP_EVENTS ? stream.write(chunk) : false);

writeToDump("[");

const discordClientCapabilities = 8189;
const openCordCapabilities = 93;
const discordMobileCapabilities = 351;
const randomCapabilities = new BitField();
randomCapabilities.add(ClientCapabilities.DeduplicateUserObjects);
randomCapabilities.add(ClientCapabilities.PrioritizedReadyPayload);
randomCapabilities.add(ClientCapabilities.ClientStateV2);

const intents = new IntentsBitField();

const initialGuildId = process.env["INITIAL_GUILD_ID"];

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
  client_state: {
    initial_guild_id: initialGuildId,
  },
  // intents: intents.toJSON(),
};

const wasteful = (msg: string) => console.warn(`wasteful payload inaccuracy! ${msg}`);

const send = (data: any) => socket.send(Buffer.from(JSON.stringify(data)));

const abort = (msg: string) => `aborted: ${msg}`;

const ok = (msg: string) => `ok: ${msg}`;

let readyPayload: ReadyData | undefined;

type test = {
  after: string,
  test: () => void,
  /** Unreliable tests will not cause a full suite failure. */
  unreliable?: boolean,
};

const tests: Record<string, test> = {
  guild_subscriptions: {
    after: "ready",
    test: () => {
      if (!readyPayload) throw new Error(abort("not ready"));
      if (readyPayload.user.bot) return;

      const selectedGuild = readyPayload.guilds[0];
      if (!selectedGuild) throw new Error(abort("no available guilds"));

      const selectedChannel = selectedGuild.channels[0];
      if (!selectedChannel) throw new Error(abort("no channels in guild"));

      send({
        op: GatewayOpcodes.LazyRequest,
        d: {
          guild_id: selectedGuild.id,
          channels: {
            [selectedChannel.id]: [[0, 99]],
          },
          activities: true,
          typing: true,
          threads: true,
        },
      });
    },
  },
  guild_member_request: {
    after: "ready",
    test: () => {
      if (!readyPayload) throw new Error(abort("not ready"));
      if (readyPayload.user.bot) return;

      const selectedGuild = readyPayload.guilds[0];
      if (!selectedGuild) throw new Error(abort("no available guilds"));

      send({
        op: GatewayOpcodes.RequestGuildMembers,
        d: {
          guild_id: [selectedGuild.id],
          limit: 1000,
          user_ids: [readyPayload.user.id],
        },
      });
    },
  },
  remote_command: {
    after: "ready",
    test: () => {
      /*
      if (!readyPayload) throw new Error(abort("not ready"));
      if (readyPayload.user.bot) return;

      const selected = readyPayload.session_id;

      send({
        op: GatewayOpcodes.RemoteCommand,
        d: {
          target_session_id: selected,
          payload: {
            type: "VOICE_STATE_UPDATE",
            self_mute: true,
            self_deaf: true,
          },
        },
      });
      */
    },
  },
  call_sync: {
    after: "ready",
    test: () => {
      if (!readyPayload) throw new Error(abort("not ready"));
      if (readyPayload.user.bot) return;

      const selected = readyPayload.private_channels[0];
      if (!selected) throw new Error(abort("no channels available"));

      send({
        op: GatewayOpcodes.CallSync,
        d: {
          channel_id: selected.id,
        },
      });
    },
  },
  request_last_messages: {
    after: "ready",
    test: () => {
      if (!readyPayload) throw new Error(abort("not ready"));
      if (readyPayload.user.bot) return;

      const selectedGuild = readyPayload.guilds[0];
      if (!selectedGuild) throw new Error(abort("no available guilds"));

      const selectedChannel = selectedGuild.channels[0];
      if (!selectedChannel) throw new Error(abort("no channels in guild"));

      send({
        op: GatewayOpcodes.RequestLastMessages,
        d: {
          guild_id: selectedGuild.id,
          channel_ids: [selectedChannel.id],
        },
      });
    },
  },
  voice_server_ping: {
    after: "ready",
    test: () => {
      send({
        op: GatewayOpcodes.VoicePing,
        d: null,
      });
    },
  },
};

socket.onopen = () => {
  console.log("connected");
};

socket.onmessage = (data) => {
  console.log("got data", data.data);

  const d = JSON.parse(data.data as string) as unknown as { op: number, t?: string, d?: any };

  writeToDump(`${data.data},`);

  switch (d.op) {
    case GatewayOpcodes.Hello: {
      console.log("gw is awaiting auth");
      send({
        op: GatewayOpcodes.Identify,
        d: identifyPayload,
      });
      break;
    }
    case GatewayOpcodes.Heartbeat: {
      send({
        op: GatewayOpcodes.Heartbeat,
      });
      break;
    }
    case GatewayOpcodes.Dispatch: {
      switch (d.t!) {
        case GatewayDispatchEvents.Ready: {
          console.log("GW Authenticated.");

          const {
            users, user_settings, presences, merged_presences, merged_members, user_settings_proto,
            user,
          } = d.d! as ReadyData;

          if (identifyPayload.capabilities & ClientCapabilities.DeduplicateUserObjects) {
            if (!Array.isArray(users)) throw new Error(`bad payload! expected users to be an array but we got ${users}`);
            if (!Array.isArray(merged_members)) throw new Error(`merged_members should be an array but its ${merged_members}`);
            if (presences) wasteful(`presences shouldn't be here but it was defined as ${presences}`);

            if (!merged_members.every((x) => x.every((member) => !!member.user_id))) {
              throw new Error(`fatal payload inaccuracy! merged_member objects need a user_id! ${merged_members}`);
            }
            if (!merged_members.every((x) => !x.every((member) => ("user" in member)))) {
              wasteful(`merged_members should not have a full user object as this is solved by the user_id property instead! ${merged_members}`);
            }

            if (identifyPayload.capabilities & ClientCapabilities.PrioritizedReadyPayload) {
              if (merged_presences) wasteful(`merged_presences shouldn't be sent in READY if we support PrioritizedReadyPayload but it was defined as ${merged_presences}`);
            } else if (!merged_presences) throw new Error(`expected merged_presences to be defined but we got ${merged_presences}`);
          } else {
            if (!Array.isArray(presences)) throw new Error(`bad payload! expected presences to be array but its defined as ${presences}`);
            if (users) wasteful(`users ${users} shouldn't be present but it is!`);
            if (merged_members) wasteful(`merged_members is not supposed to be sent! ${merged_members}`);
            if (merged_presences) wasteful(`merged_presences isnt supposed to be here but its defined as ${merged_presences}`);
          }

          if (!user.bot) {
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
          }

          readyPayload = d.d!;

          const readyTests = Object.entries(tests).filter(([name, test]) => test.after === "ready");

          readyTests.forEach(([name, test]) => {
            console.log(`RUNS: ${name}`);

            try {
              test.test();
              console.log(ok(name));
            } catch (e) {
              console.error(`FAILED: ${name}, ${e}`);
            }
          });
          break;
        }
        case GatewayDispatchCodes.ReadySupplemental: {
          console.log("Supplemental received");

          const { merged_members, merged_presences } = d.d! as ReadySupplementalData;

          if (!Array.isArray(merged_members)) throw new Error(`fatal payload inaccuracy! expected merged_members to be an array but we got ${merged_members}`);
          if (!merged_presences) throw new Error(`fatal payload inaccuracy! expected merged_presences to be defined but we got ${merged_presences}`);
          break;
        }
        case GatewayDispatchCodes.UserSettingsUpdate: {
          if (identifyPayload.capabilities & ClientCapabilities.UserSettingsProto) {
            throw new Error("potentially fatal inconsistency! got JSON settings update but client only wants protobufs! THIS CAN MESS WITH STATE IN SOME DISCORD CLIENTS!!");
          }
          break;
        }
        case GatewayDispatchCodes.GuildMemberListUpdate: {
          const {
            ops, member_count, online_count, guild_id,
          } = d.d! as GatewayLazyRequestDispatchData;

          const syncOps = ops.filter((x): x is LazyOperatorSync => x.op === "SYNC");

          if (!syncOps.every((x) => Array.isArray(x.range)
            && x.range[0] <= x.range[1] && x.items.length - 1 <= x.range[1])) throw new Error(`bad member list ${d.d}`);

          break;
        }
        case GatewayDispatchEvents.GuildMembersChunk: {
          const { chunk_index, chunk_count } = d.d!;

          if (chunk_index >= chunk_count) {
            throw new Error(`bad chunk index! index ${chunk_index} is greater than or equal to ${chunk_count}`);
          }

          break;
        }
        case GatewayDispatchCodes.LastMessages: {
          const { messages, guild_id } = d.d!;

          if (!Array.isArray(messages)) throw new Error(`lazy_messages.messages should be an array but it's a ${typeof messages}`);

          if (typeof guild_id !== "string") throw new Error(`lazy_messages.guild_id should be a string but it's a ${typeof guild_id}`);

          break;
        }
        case GatewayDispatchCodes.InitialGuild: {
          const { id } = d.d!;

          if (id !== initialGuildId) throw new Error(`expected initial guild ${initialGuildId} but got ${id}`);

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
  console.log("Session closed. Testing complete.", data.code, data.reason);
  writeToDump("]");
  stream.end();
  process.exit(1);
};
