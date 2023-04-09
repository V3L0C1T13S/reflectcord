import { APIDMChannelBase, ChannelType } from "discord.js";

/**
 * GatewayPrivateChannel DTO sent out when the client supports the
 * DeduplicateUserObjects capability.
*/
export interface GatewayPrivateChannel extends Omit<APIDMChannelBase<ChannelType.DM | ChannelType.GroupDM>, "recipients"> {
  last_message_id?: string | null,
  recipient_ids: string[],
  is_spam?: boolean,
  owner_id?: string,
  icon?: string | null,
}
