export interface ActivityCreateParams {
  appId: string;
  channelId: string;
  guildId: string;
}

export interface APIActivity {
  activity_id: string,
  application_id: string,
  assets: unknown | null,
  created_at: unknown | null,
  details: unknown | null,
  name: string,
  secrets: unknown | null,
  state: unknown | null,
  type: unknown | null,
  timestamps: unknown | null,
}

export const KnownActivityIDs = {
  WatchTogether: "880218394199220334",
};

export const Activities: Record<string, APIActivity> = {
  [KnownActivityIDs.WatchTogether]: {
    type: null,
    timestamps: null,
    state: null,
    secrets: null,
    name: "Watch Together",
    details: null,
    created_at: null,
    assets: null,
    application_id: "880218394199220334",
    activity_id: "", // This causes some very unique problems for clients
  },
};
