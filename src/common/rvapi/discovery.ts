export type DiscoveryMedia = {
  _id: string,
  tag: string,
  filename: string,
  metadata: {
    type: string,
    width: number,
    height: number,
  },
  content_type: string,
  size: number,
}

export type DiscoveryServer = {
  _id: string,
  name: string,
  icon?: DiscoveryMedia,
  banner?: DiscoveryMedia,
  description: string,
  flags: number,
  tags: string[],
  members: number,
  /**
   * High: Usually 2000 or more messages in the past 12 hours
   * Medium: Around 800 messages in the past 12 hours
   * Low: Little to no messages in the past 12 hours
   */
  activity: "high" | "medium" | "low",
}

export type ServerDiscoveryResponse = {
  __N_SSG: boolean,
  pageProps: {
    servers: DiscoveryServer[],
    popularTags: string[],
  }
}
