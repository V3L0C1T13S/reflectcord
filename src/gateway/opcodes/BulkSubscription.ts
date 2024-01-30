import { GatewayOpcodes } from "@reflectcord/common/sparkle";
import { Payload } from "../util";
import { WebSocket } from "../Socket";
import { lazyReq } from "./lazyReq";

interface BulkSubscriptionData {
  subscriptions: Record<string, any>
}

export async function BulkSubscription(this: WebSocket, data: Payload<BulkSubscriptionData>) {
  if (!data.d) throw new Error("Data is required.");

  const { subscriptions } = data.d;

  await Promise.all(Object.entries(subscriptions)
    .map(([guild, subscription]) => lazyReq.call(this, {
      d: {
        guild_id: guild,
        ...subscription,
      },
      op: GatewayOpcodes.LazyRequest,
    })));
}
