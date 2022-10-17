import { MongoClient } from "mongodb";
import { mongoURL } from "../constants";

export namespace DbManager {
  export const client = new MongoClient(mongoURL);
}
