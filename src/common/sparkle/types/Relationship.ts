/* eslint-disable no-shadow */

export enum UserRelationshipType {
  Friends = 1,
  Blocked = 2,
  Incoming = 3,
  Outgoing = 4,
}

export type UserRelations = {
  id?: string,
  username?: string,
  avatar?: string | null,
  discriminator?: string,
  public_flags?: number | undefined,
}

export type SendFriendRequestData = {
  username: string,
}
