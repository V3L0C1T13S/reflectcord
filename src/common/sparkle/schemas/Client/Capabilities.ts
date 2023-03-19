/* eslint-disable no-bitwise */

export const ClientCapabilities = {
  /**
   * Controls if notes will be sent during READY
   * or fetched by the client via the notes route
  */
  LazyUserNotes: 1 << 0,
  NoAffineUserIds: 1 << 1,
  VersionedReadStates: 1 << 2,
  VersionedUserGuildSettings: 1 << 3,
  DeduplicateUserObjects: 1 << 4,
  PrioritizedReadyPayload: 1 << 5,
  MultipleGuildExperimentPopulations: 1 << 6,
  NonChannelReadStates: 1 << 7,
  AuthTokenRefresh: 1 << 8,
  /**
   * Controls if the client will receive
   * user_settings_proto (protobuf) or user_settings (JSON)
  */
  UserSettingsProto: 1 << 9,
  /**
   * Client wants to receive newer DTOs
   *
   * Known changes when true:
   * New Guild DTOs are sent
  */
  ClientStateV2: 1 << 10,
  PassiveGuildUpdate: 1 << 11,
};

export interface CapabilitiesObject {
  LazyUserNotes: boolean,
  NoAffineUserIds: boolean,
  VersionedReadStates: boolean,
  VersionedUserGuildSettings: boolean,
  DeduplicateUserObjects: boolean,
  PrioritizedReadyPayload: boolean,
  MultipleGuildExperimentPopulations: boolean,
  NonChannelReadStates: boolean,
  AuthTokenRefresh: boolean,
  UserSettingsProto: boolean,
  ClientStateV2: boolean,
  PassiveGuildUpdate: boolean,
}

export const DefaultCapabilities: CapabilitiesObject = {
  LazyUserNotes: false,
  NoAffineUserIds: true,
  VersionedReadStates: false,
  VersionedUserGuildSettings: false,
  DeduplicateUserObjects: false,
  PrioritizedReadyPayload: false,
  MultipleGuildExperimentPopulations: false,
  NonChannelReadStates: false,
  AuthTokenRefresh: false,
  UserSettingsProto: false,
  ClientStateV2: false,
  PassiveGuildUpdate: false,
};

export function IdentifyCapabilities(capabilties: number): CapabilitiesObject {
  return {
    LazyUserNotes: !!(capabilties & ClientCapabilities.LazyUserNotes),
    NoAffineUserIds: !!(capabilties & ClientCapabilities.NoAffineUserIds),
    VersionedReadStates: !!(capabilties & ClientCapabilities.VersionedReadStates),
    VersionedUserGuildSettings: !!(capabilties & ClientCapabilities.VersionedUserGuildSettings),
    DeduplicateUserObjects: !!(capabilties & ClientCapabilities.DeduplicateUserObjects),
    PrioritizedReadyPayload: !!(capabilties & ClientCapabilities.PrioritizedReadyPayload),
    // eslint-disable-next-line max-len
    MultipleGuildExperimentPopulations: !!(capabilties & ClientCapabilities.MultipleGuildExperimentPopulations),
    NonChannelReadStates: !!(capabilties & ClientCapabilities.NonChannelReadStates),
    AuthTokenRefresh: !!(capabilties & ClientCapabilities.AuthTokenRefresh),
    UserSettingsProto: !!(capabilties & ClientCapabilities.UserSettingsProto),
    ClientStateV2: !!(capabilties & ClientCapabilities.ClientStateV2),
    PassiveGuildUpdate: !!(capabilties & ClientCapabilities.PassiveGuildUpdate),
  };
}
