import { API } from "revolt.js";
import { invert } from "lodash";
import { APIUser } from "discord.js";
import { GatewayRelationshipData, UserRelationshipType } from "../../sparkle";
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

export class GatewayRelationshipDTO implements GatewayRelationshipData {
  id: string;
  type: UserRelationshipType;
  nickname: string;
  user_id?: string;
  user?: APIUser;

  constructor(data: { user: APIUser, type: UserRelationshipType }, deduplicate?: boolean) {
    this.id = data.user.id;
    this.type = data.type;
    this.nickname = data.user.username;

    if (deduplicate) this.user_id = data.user.id;
    else this.user = data.user;
  }
}
