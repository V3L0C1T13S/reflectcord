/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { uploadBase64File } from "@reflectcord/cdn/util";
import { HTTPError } from "@reflectcord/common/utils";
import { fromSnowflake, Member } from "@reflectcord/common/models";
import { Request, Response } from "express";

export const patchSelfMember = async (req: Request, res: Response) => {
  const { guild_id } = req.params;
  if (!guild_id) throw new HTTPError("Invalid params");

  const serverId = await fromSnowflake(guild_id);
  const user = await res.rvAPIWrapper.users.getSelf();

  const { avatar, banner } = req.body;

  const userPatchBody: API.DataMemberEdit = {};

  if (avatar) {
    const avatarId = avatar && avatar.startsWith("data:") ? await uploadBase64File("avatars", {
      name: "avatar.png",
      file: avatar,
    }) : null;

    userPatchBody.avatar = avatarId;
  } else if (avatar === null) {
    userPatchBody.remove ??= [];
    userPatchBody.remove.push("Avatar");
  }

  const member = await res.rvAPI.patch(`/servers/${serverId as ""}/members/${user._id as ""}`, userPatchBody);

  res.json(await Member.from_quark(member, {
    user,
  }));
};

export default () => <Resource> {
  patch: patchSelfMember,
};
