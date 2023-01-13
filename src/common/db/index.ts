import { MongoClient } from "mongodb";
import mongoose from "mongoose";
import { mongoURL } from "../constants";

export namespace DbManager {
  export const client = new MongoClient(mongoURL);
  export const mongooseClient = mongoose.createConnection(mongoURL);
}

export async function initDb() {
  await DbManager.client.connect();
  await mongoose.connect(mongoURL);
}
