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

export const messageEmitMember = process.env["MESSAGE_EMIT_MEMBER"] ?? false;
