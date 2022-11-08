import dotenv from "dotenv";

dotenv.config();

export const gatewayEnableOp8 = process.env["GATEWAY_ENABLE_OP8"] ?? false;

export const embedEnableSpecials = process.env["EMBED_ENABLE_SPECIALS"] ?? false;
