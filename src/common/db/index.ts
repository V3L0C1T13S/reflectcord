import { MongoClient } from "mongodb";
import mongoose from "mongoose";
import { mongoURL } from "../constants";

export type snowflakeConversionData = {
  snowflake: string;
  _id: string;
}

export namespace DbManager {
  export const client = new MongoClient(mongoURL);
  export const mongooseClient = mongoose.createConnection(mongoURL);
  export const snowflakes = client.db("reflectcord")
    .collection<snowflakeConversionData>("converted_snowflakes");
}

export async function initDb() {
  await DbManager.client.connect();
  await mongoose.connect(mongoURL);
  await DbManager.snowflakes.createIndex({ snowflake: 1 }, { unique: true });
}
