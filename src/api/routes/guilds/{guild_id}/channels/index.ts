/* eslint-disable camelcase */
import { Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { APIChannel, ChannelType as discordChannelType, RESTPostAPIGuildChannelJSONBody } from "discord.js";
import { ulid } from "ulid";
import { HTTPError, validate } from "@reflectcord/common/utils";
import {
  fromSnowflake, Channel, GuildCategory, tryFromSnowflake,
  HandleChannelsAndCategories, ChannelCreateBody, Permissions,
  toSnowflake,
} from "@reflectcord/common/models";
import { ChannelCreateBody as DiscordChannelCreate } from "@reflectcord/common/sparkle";
import { API } from "revolt.js";

const validTypes = [
  discordChannelType.GuildText,
  discordChannelType.GuildVoice,
  discordChannelType.GuildCategory,
];

export default () => <Resource> {
  get: async (req, res: Response<APIChannel[]>) => {
    const { guild_id } = req.params;

    if (!guild_id) return res.sendStatus(504);

    const rvId = await fromSnowflake(guild_id);

    const api = res.rvAPI;

    const rvGuild = await api.get(`/servers/${rvId as ""}`);
    const channels = await Promise.all(rvGuild.channels
      .map((channel) => api.get(`/channels/${channel as ""}`)));

    return res.json(await HandleChannelsAndCategories(channels, rvGuild.categories, rvId));
  },
  post: {
    middleware: validate(DiscordChannelCreate),
    handler: async (
      req: Request<any, any, RESTPostAPIGuildChannelJSONBody>,
      res: Response<APIChannel>,
    ) => {
      const { body } = req;
      const {
        name, type, parent_id, permission_overwrites,
      } = body;
      const { guild_id } = req.params;

      if (type && !validTypes.includes(type)) throw new HTTPError(`Unimplemented channel type ${type}`, 500);
      if (!guild_id || !name) throw new HTTPError("Invalid params");

      const rvId = await fromSnowflake(guild_id);

      if (type === discordChannelType.GuildCategory) {
        const categoryId = ulid();
        const currentServer = await res.rvAPI.get(`/servers/${rvId as ""}`);
        const newServer = await res.rvAPI.patch(`/servers/${rvId as ""}`, {
          categories: [...currentServer.categories ?? [], {
            channels: [],
            id: categoryId,
            title: name,
          }],
        });

        const rvCategory = newServer.categories?.find((x) => x.id === categoryId);
        if (!rvCategory) throw new HTTPError("Category couldn't be found on the server", 500);

        res.status(201).json(await GuildCategory.from_quark(rvCategory, {
          server: rvId,
        }));
      } else {
        const rvChannel = await res.rvAPI.post(`/servers/${rvId as ""}/channels`, await ChannelCreateBody.to_quark(body));
        let rvCategory: string | null = null;
        let patchedCategory: API.Category | null = null;
        // FIXME: Should we throw an error here if not server or just passthrough?
        if (parent_id && ("server" in rvChannel && rvChannel.server)) {
          rvCategory = await tryFromSnowflake(parent_id.toString());

          const rvServer = await res.rvAPI.get(`/servers/${rvId as ""}`);
          const categoryToPatch = rvServer.categories?.find((x) => x.id === rvCategory);
          if (!categoryToPatch) throw new HTTPError("Category doesn't exist");

          categoryToPatch.channels.push(rvChannel._id);
          await res.rvAPI.patch(`/servers/${rvId as ""}`, {
            categories: rvServer.categories ?? [],
          });

          patchedCategory = categoryToPatch;
        }

        if (permission_overwrites && ("server" in rvChannel && rvChannel.server)) {
          // TODO: Cleanup this garbage. Maybe an abstraction into RVAPI would help here.
          await Promise.all(permission_overwrites.map(async (perm) => {
            if (!perm.id) return;

            const allow = perm.allow ? BigInt(perm.allow) : null;
            const deny = perm.deny ? BigInt(perm.deny) : null;

            let rvRole = await fromSnowflake(perm.id.toString());
            if (rvRole === rvChannel.server) rvRole = "default";

            const rvAllow = allow ? await Permissions.to_quark(allow) : null;
            const rvDeny = deny ? await Permissions.to_quark(deny) : null;

            await res.rvAPI.put(`/channels/${rvChannel._id as ""}/permissions/${rvRole as ""}`, {
              permissions: {
                allow: rvAllow?.a ?? 0,
                deny: rvDeny?.a ?? 0,
              },
            });

            if (!rvChannel.role_permissions) rvChannel.role_permissions = {};

            if (rvRole === "default") {
              rvChannel.default_permissions = {
                a: rvAllow?.a ?? 0,
                d: rvDeny?.a ?? 0,
              };
            } else {
              rvChannel.role_permissions[rvRole] = {
                a: rvAllow?.a ?? 0,
                d: rvDeny?.a ?? 0,
              };
            }
          }));
        }

        res.status(201).json(await Channel.from_quark(rvChannel, {
          allCategories: patchedCategory ? [patchedCategory] : null,
        }));
      }
    },
  },
  patch: async (req, res) => {
    res.sendStatus(500);
  },
};
