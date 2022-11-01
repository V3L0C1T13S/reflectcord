import { APIGuildMember } from "discord.js";
import { API } from "revolt.js";
import { BaseManager } from "./BaseManager";
import { QuarkContainer } from "./types";

export type MemberContainer = QuarkContainer<API.Member, APIGuildMember>;

export class MemberManager extends BaseManager<string, MemberContainer> {}
