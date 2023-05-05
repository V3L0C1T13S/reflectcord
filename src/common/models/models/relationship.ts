import { API } from "revolt.js";
import { invert } from "lodash";
import { UserRelationshipType } from "../../sparkle";
import { QuarkConversion } from "../QuarkConversion";

type ConvertableRelationships = Exclude<API.RelationshipStatus, "None" | "User">;

const RelationshipMap: Record<ConvertableRelationships, UserRelationshipType> = {
  Friend: UserRelationshipType.Friends,
  BlockedOther: UserRelationshipType.Blocked,
  Blocked: UserRelationshipType.Blocked,
  Outgoing: UserRelationshipType.Outgoing,
  Incoming: UserRelationshipType.Incoming,
};

const RelationshipMapRevolt: Record<UserRelationshipType, ConvertableRelationships> = {
  ...invert(
    RelationshipMap,
  ) as Record<UserRelationshipType, ConvertableRelationships>,
  [UserRelationshipType.Blocked]: "Blocked", // overriding again incase BlockedOther takes priority
};

export const RelationshipType: QuarkConversion<API.RelationshipStatus, UserRelationshipType> = {
  async to_quark(type) {
    return RelationshipMapRevolt[type];
  },

  async from_quark(type) {
    // TODO (types)
    return RelationshipMap[type as ConvertableRelationships] ?? UserRelationshipType.Friends;
  },
};
