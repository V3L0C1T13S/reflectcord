import { Resource } from "express-automatic-routes";
import axios from "axios";
import { Channel } from "@reflectcord/common/models";

export default () => <Resource> {
  get: async (req, res) => {
    const { channelId } = req.params;
    const channel = await axios.get(`https://discord.com/api/v10/channels/${channelId}`);

    res.json(await Channel.to_quark(channel.data));
  },
};
