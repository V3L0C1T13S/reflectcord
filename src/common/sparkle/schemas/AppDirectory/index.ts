import { APIApplication } from "discord.js";

export type GeneralCategory = {
  id: number,
  name: string,
}

export type Bot = {
  id: string,
  username: string,
  avatar: string,
  avatar_decoration: any,
  discriminator: string,
  public_flags: number,
  bot: boolean,
}

export type App = Omit<APIApplication, "rpc_origins"> & {
  type: number,
  bot: Bot,
  hook: boolean,
}

export type AppCategory = {
  id: string,
  active: boolean,
  type: number,
  position: number,
  title: string,
  description: string,
  application_directory_collection_items: App[],
}
