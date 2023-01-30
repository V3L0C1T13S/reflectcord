import { MongoClient } from "mongodb";
import mongoose from "mongoose";
import { mongoURL } from "../constants";

export type snowflakeConversionData = {
  snowflake: string;
  _id: string;
}

export namespace DbManager {
  export const client = new MongoClient(mongoURL);
  // eslint-disable-next-line import/no-mutable-exports
  export let mongooseClient: mongoose.Connection;
  export const snowflakes = client.db("reflectcord")
    .collection<snowflakeConversionData>("converted_snowflakes");
  export const hashes = client.db("reflectcord")
    .collection("converted_hashes");
  export const fileUploads = client.db("reflectcord")
    .collection("file_uploads");
}

export async function initDb() {
  await DbManager.client.connect();
  DbManager.mongooseClient = mongoose.createConnection(mongoURL);
  await mongoose.connect(mongoURL);
  await DbManager.snowflakes.createIndex({ snowflake: 1 }, { unique: true });
  await DbManager.hashes.createIndex({ snowflake: 1 }, { unique: true });
}
