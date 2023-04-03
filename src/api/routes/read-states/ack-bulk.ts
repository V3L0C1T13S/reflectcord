import { Request } from "express";
import { Resource } from "express-automatic-routes";
import { multipleFromSnowflake } from "@reflectcord/common/models";
import { AckBulkBody } from "@reflectcord/common/sparkle";

export default () => <Resource> {
  post: async (req: Request<{}, {}, AckBulkBody>, res) => {
    const requests = req.body.read_states;

    // FIXME: We may need local rate limiting here
    await Promise.all(requests
      .map(async (x) => {
        const [rvChannel, rvMsg] = await multipleFromSnowflake([x.channel_id, x.message_id]);
        await res.rvAPIWrapper.messages.ack(rvChannel!, rvMsg!);
      }));

    res.sendStatus(204);
  },
};
