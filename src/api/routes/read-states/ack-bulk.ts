import { Request } from "express";
import { Resource } from "express-automatic-routes";
import { fromSnowflake } from "@reflectcord/common/models";

interface AckRequest {
  channel_id: string,
  message_id: string,
}

interface AckBulkBody {
  read_states: AckRequest[],
}

export default () => <Resource> {
  post: async (req: Request<{}, {}, AckBulkBody>, res) => {
    const requests = req.body.read_states;

    // FIXME: We may need local rate limiting here
    await Promise.all(requests
      .map(async (x) => {
        const rvChannel = await fromSnowflake(x.channel_id);
        const rvMsg = await fromSnowflake(x.message_id);
        await res.rvAPI.put(`/channels/${rvChannel as ""}/ack/${rvMsg as ""}`);
      }));

    res.sendStatus(204);
  },
};
