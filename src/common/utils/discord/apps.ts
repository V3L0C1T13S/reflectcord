import axios from "axios";
import { DbManager } from "../../db";
import { Logger } from "../Logger";

const discordAppsURL = "https://discord.com/api/v9/applications/detectable";

const appData = DbManager.client.db("reflectcord")
  .collection("discordApps");

let rawAppData: any[];

interface AppDataResponse {
  rawAppData: any,
  appData: typeof appData,
}

export async function GetDetectableApps(): Promise<AppDataResponse> {
  if (await appData.estimatedDocumentCount() > 0) {
    if (!rawAppData) rawAppData = (await appData.find().toArray()).map((x) => x);
    return {
      rawAppData,
      appData,
    };
  }

  Logger.log("Getting app data");

  const client = axios.create();

  const apps = await client.get(discordAppsURL);

  await appData.insertMany(apps.data);

  rawAppData = (await appData.find().toArray()).map((x) => x);

  return {
    rawAppData,
    appData,
  };
}
