import { MongoClient } from "mongodb";
import mongoose from "mongoose";
import {
  Channel, ChannelUnread, Member, Message, Server, SessionInfo, User,
} from "revolt-api";
import { RevoltSettings } from "../models";
import { mongoURL } from "../constants";

export type snowflakeConversionData = {
  snowflake: string;
  _id: string;
}

export type HashConverion = snowflakeConversionData;

export type BaseRevoltDocument = {
  _id: string,
}

export namespace DbManager {
  export const client = new MongoClient(mongoURL);
  // eslint-disable-next-line import/no-mutable-exports
  export let mongooseClient: mongoose.Connection;
  export const snowflakes = client.db("reflectcord")
    .collection<snowflakeConversionData>("converted_snowflakes");
  export const hashes = client.db("reflectcord")
    .collection<HashConverion>("converted_hashes");
  export const fileUploads = client.db("reflectcord")
    .collection("file_uploads");
  export const revoltDb = client.db("revolt");
  export const revoltChannels = revoltDb.collection<Channel>("channels");
  export const revoltServers = revoltDb.collection<Server>("servers");
  export const revoltMembers = revoltDb.collection<Member>("server_members");
  export const revoltChannelUnreads = revoltDb.collection<ChannelUnread>("channel_unreads");
  export const revoltUsers = revoltDb.collection<User>("users");
  export const revoltSessions = revoltDb.collection<SessionInfo>("sessions");
  export const revoltMessages = revoltDb.collection<Message>("messages");
  export const revoltSettings = revoltDb.collection<RevoltSettings & { _id: string }>("user_settings");
}

export async function initDb() {
  await DbManager.client.connect();
  DbManager.mongooseClient = mongoose.createConnection(mongoURL);
  await mongoose.connect(mongoURL);
  await DbManager.snowflakes.createIndex({ snowflake: 1 }, { unique: true });
  await DbManager.hashes.createIndex({ snowflake: 1 }, { unique: true });
}
