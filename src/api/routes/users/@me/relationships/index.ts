/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { UserRelationshipType } from "../../../../../common/sparkle";
import { User } from "../../../../../common/models";
import { HTTPError } from "../../../../../common/utils";

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const selfId = await res.rvAPI.get("/auth/account/");
    const selfInfo = await res.rvAPI.get(`/users/${selfId._id}`) as API.User;

    const friends = selfInfo.relations
      ?.filter((x) => x.status === "Friend") ?? [];

    const friendProfiles: API.User[] = [];

    for (const x of friends) {
      friendProfiles.push(await res.rvAPI.get(`/users/${x._id}`) as API.User);
    }

    const convertedProfiles = await Promise.all(friendProfiles
      .map((x) => User.from_quark(x)));

    const relations = convertedProfiles.map((x) => ({
      id: x.id,
      type: UserRelationshipType.Friends,
      nickname: null,
      user: x,
    }));

    res.json(relations);
  },
  post: async (req, res) => {
    const { username } = req.body;
    if (!username) throw new HTTPError("Invalid username", 244);

    const rvRes = await res.rvAPI.post("/users/friend", {
      username,
    });

    res.json(await User.from_quark(rvRes));
  },
};
