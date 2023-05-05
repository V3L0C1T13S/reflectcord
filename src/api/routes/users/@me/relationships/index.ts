/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { UserRelationshipType, DiscordErrorMessages, DiscordErrors } from "@reflectcord/common/sparkle";
import { RelationshipType, User } from "@reflectcord/common/models";
import { FieldError, HTTPError } from "@reflectcord/common/utils";
import { isAxiosError } from "axios";

export default () => <Resource> {
  get: async (req, res) => {
    const selfInfo = await res.rvAPIWrapper.users.getSelf(true);

    const friends = selfInfo.relations
      ?.filter((x) => x.status !== "None" && x.status !== "User") ?? [];

    const friendProfiles: API.User[] = [];

    for (const x of friends) {
      friendProfiles.push(await res.rvAPI.get(`/users/${x._id as ""}`));
    }

    const convertedProfiles = await Promise.all(friendProfiles
      .map(async (x) => ({
        user: await User.from_quark(x),
        relationship: x.relationship
          ? await RelationshipType.from_quark(x.relationship)
          : UserRelationshipType.Friends,
      })));

    const relations = convertedProfiles.map((x) => ({
      id: x.user.id,
      type: x.relationship,
      nickname: null,
      user: x.user,
    }));

    res.json(relations);
  },
  post: async (req, res) => {
    const { username } = req.body;
    if (!username) throw new HTTPError("Invalid username", 404);

    const rvRes = await res.rvAPI.post("/users/friend", {
      username,
    }).catch((error) => {
      if (isAxiosError(error)) {
        if (error.response?.data.type === "AlreadyFriends") {
          throw new FieldError(
            DiscordErrors.AlreadyFriendsError,
            DiscordErrorMessages.AlreadyFriendsError,
          );
        }
      }

      throw new HTTPError("Unknown");
    });

    res.json(await User.from_quark(rvRes));
  },
};
