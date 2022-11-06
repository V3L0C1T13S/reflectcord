import dotenv from "dotenv";
import { getNextData } from "../rvapi/discovery";

dotenv.config();

export * from "./tests";
export * from "./features";

export const baseURL = "http://localhost:3000";

export const AutumnURL = process.env["AUTUMN_URL"] ?? "https://autumn.revolt.chat";

export const mongoURL = process.env["MONGO_URL"] ?? "mongodb://localhost:27017/reflectcord";

export const discordEpoch = process.env["DISCORD_EPOCH"] ?? "1420070400000";

export const enableLogging = process.env["ENABLE_LOGGING"] ?? false;

export const revoltBaseURL = process.env["REVOLT_BASE_URL"] ?? "https://revolt.chat";

export const revoltApiURL = process.env["REVOLT_API_URL"] ?? "https://api.revolt.chat";

export const revoltJanuaryURL = process.env["REVOLT_JANUARY_URL"] ?? "https://jan.revolt.chat";

// FIXME: Dunno if we really want to use this since rvlt.gg is currently closed source.
export const revoltDiscoveryURL = process.env["REVOLT_DISCOVERY_URL"] ?? "https://rvlt.gg";

export const rabbitMqURL = process.env["RABBITMQ_URL"] ?? "amqp://localhost:5672";

export const reflectcordCDNURL = process.env["REFLECTCORD_CDN_URL"] ?? "localhost:3001";

export const reflectcordWsURL = process.env["REFLECTCORD_WS_URL"] ?? "ws://localhost:3002";

export const gifBoxURL = process.env["GIFBOX_URL"] ?? "https://gifbox.me";

export const gifBoxAPIUrl = process.env["GIFBOX_API_URL"] ?? "https://api.gifbox.me";

export async function getRevoltDiscoveryDataURL() {
  const discoveryBuildId = await getNextData();

  return `${revoltDiscoveryURL}/_next/data/${discoveryBuildId}`;
}
