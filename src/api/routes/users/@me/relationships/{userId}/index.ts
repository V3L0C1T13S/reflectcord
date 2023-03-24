import { Resource } from "express-automatic-routes";
import { fromSnowflake } from "@reflectcord/common/models/util";
import { HTTPError } from "@reflectcord/common/utils";
import { UserRelationshipType } from "@reflectcord/common/sparkle";
import { API } from "revolt-api";

interface RelationshipPutSchema {
  type: UserRelationshipType
}

async function updateRelationship(options: {
  rvAPI: API, userId: string, type: UserRelationshipType
}) {
  const { rvAPI, userId, type } = options;

  switch (type) {
    case UserRelationshipType.Blocked: {
      await rvAPI.put(`/users/${userId as ""}/block`);
      break;
    }
    case UserRelationshipType.Friends: {
      await rvAPI.put(`/users/${userId as ""}/friend`);
      break;
    }
    default: {
      throw new HTTPError(`Unhandled friendship type ${type}`, 500);
    }
  }
}

export default () => <Resource> {
  put: async (req, res) => {
    const { userId } = req.params;
    const { type } = req.body as RelationshipPutSchema;

    if (!userId) throw new HTTPError("Invalid params");

    const rvUserId = await fromSnowflake(userId);

    await updateRelationship({
      rvAPI: res.rvAPI as any,
      userId: rvUserId,
      type: type ?? UserRelationshipType.Friends,
    });

    res.sendStatus(204);
  },
  delete: async (req, res) => {
    const { userId } = req.params;

    if (!userId) throw new HTTPError("Invalid params");

    const rvUserId = await fromSnowflake(userId);

    await res.rvAPI.delete(`/users/${rvUserId}/friend`);

    res.sendStatus(204);
  },
};
