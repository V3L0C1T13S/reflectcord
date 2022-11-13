import dotenv from "dotenv";

dotenv.config();

export const priviligedUsers: string[] = process.env["PRIVILIGED_USERS"] as unknown as string[] ?? [];
