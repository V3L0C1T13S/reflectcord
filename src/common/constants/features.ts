import dotenv from "dotenv";

dotenv.config();

export const embedEnableSpecials = process.env["EMBED_ENABLE_SPECIALS"] ?? false;

export const selfEnableServerLeaves = process.env["SELF_ENABLE_SERVER_LEAVES"] ?? false;

export const enableMetrics = process.env["ENABLE_ANALYTICS"] ?? false;

export const enableTracking = process.env["ENABLE_TRACKING"] ?? false;
