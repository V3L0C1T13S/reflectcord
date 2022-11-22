import { Schema } from "mongoose";
import { DbManager } from "@reflectcord/common/db";

export const RelationshipSchema = new Schema({
  nickname: { type: String, required: false },
});

export const RelationshipModel = DbManager.mongooseClient
  .model("RelationshipSchema", RelationshipSchema);
