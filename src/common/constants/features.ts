import dotenv from "dotenv";

dotenv.config();

export const embedEnableSpecials = process.env["EMBED_ENABLE_SPECIALS"] ?? false;

export const selfEnableServerLeaves = process.env["SELF_ENABLE_SERVER_LEAVES"] ?? false;

export const enableMetrics = process.env["ENABLE_ANALYTICS"] ?? false;

export const enableTracking = process.env["ENABLE_TRACKING"] ?? false;

export const enableRoleMemberCounts = process.env["ROLE_MEMBER_COUNTS"] ?? false;

export const messageFullMentions = process.env["MESSAGE_FULL_MENTIONS"] ?? false;

export const RPCUseStub = process.env["RPC_USE_STUB"] ?? false;

export const enableProfileThemes = process.env["ENABLE_PROFILE_THEMES"] ?? false;

export const enableBodyValidation = process.env["ENABLE_BODY_VALIDATION"] ?? false;

export type apiWrapperModes = "api" | "mongo";
export const rvAPIMode: apiWrapperModes = process.env["RVAPI_MODE"] as apiWrapperModes ?? "api";
if (rvAPIMode === "mongo") {
  // eslint-disable-next-line no-console
  console.warn("ATTENTION!!!\nYou are running Reflectcord in Mongo data mode. This could lead to sensitive data leaks. USE AT YOUR OWN RISK! YOU HAVE BEEN WARNED!");
}
