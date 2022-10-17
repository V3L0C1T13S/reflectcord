import dotenv from "dotenv";

dotenv.config();

export const baseURL = "http://localhost:3000";

export const AutumnURL = process.env["AUTUMN_URL"] ?? "https://autumn.revolt.chat";

export const mongoURL = process.env["MONGO_URL"] ?? "mongodb://localhost:27017/reflectcord";

export const discordEpoch = process.env["DISCORD_EPOCH"] ?? "1420070400000";
