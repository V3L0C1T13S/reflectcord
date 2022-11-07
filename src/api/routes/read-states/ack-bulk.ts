/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { Resource } from "express-automatic-routes";
import { fromSnowflake } from "../../../common/models/util";

interface AckRequest {
  channel_id: string,
  message_id: string,
}

export default () => <Resource> {
  post: async (req, res) => {
    const requests = req.body.read_states as AckRequest[];

    for (const ackRequest of requests) {
      const rvChannel = await fromSnowflake(ackRequest.channel_id);
      const rvMsg = await fromSnowflake(ackRequest.message_id);
      await res.rvAPI.put(`/channels/${rvChannel as ""}/ack/${rvMsg as ""}`);
    }

    res.sendStatus(204);
  },
};
