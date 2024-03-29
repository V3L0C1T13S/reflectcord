import axios from "axios";
import { discordBaseAPIURL } from "@reflectcord/common/constants";
import { DbManager } from "../../db";
import { Logger } from "../Logger";

const client = axios.create();
const discordAppsURL = `${discordBaseAPIURL}/applications/detectable`;

export const appData = DbManager.client.db("reflectcord")
  .collection("discordApps");

let rawAppData: any[];

interface AppDataResponse {
  rawAppData: any,
  appData: typeof appData,
}

export async function GetDetectableApps(): Promise<AppDataResponse> {
  if (await appData.estimatedDocumentCount() > 0) {
    if (!rawAppData) rawAppData = (await appData.find().toArray());
    return {
      rawAppData,
      appData,
    };
  }

  Logger.log("Getting app data");

  const apps = await client.get(discordAppsURL);

  await appData.insertMany(apps.data);

  rawAppData = (await appData.find().toArray());

  return {
    rawAppData,
    appData,
  };
}

export async function GetRPCApplication(appId: string) {
  const app = await appData.findOne({
    id: appId,
  }) ?? (await client.get(`${discordBaseAPIURL}/oauth2/applications/${appId}/rpc`)).data;

  await appData.findOneAndReplace({
    id: appId,
  }, app, { upsert: true });

  return app;
}
