import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  post: (req, res) => {
    res.json({
      id: "",
      type: 0,
      content: "",
      channel_id: "",
      author: {
        id: "", username: "", avatar: "", discriminator: "", public_flags: 64,
      },
      attachments: [],
      embeds: [],
      mentions: [],
      mention_roles: [],
      pinned: false,
      mention_everyone: false,
      tts: false,
      timestamp: "",
      edited_timestamp: null,
      flags: 1,
      components: [],
    }).status(200);
  },
};
