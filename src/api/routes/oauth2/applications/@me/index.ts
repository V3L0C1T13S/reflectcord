import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: (req, res) => {
    res.json({
      id: "",
      name: "",
      icon: "",
      description: "",
      summary: "",
      type: null,
      cover_image: "",
      hook: true,
      bot_public: false,
      bot_require_code_grant: false,
      verify_key: "",
      owner:
          {
            id: "",
            username: "",
            avatar: "",
            avatar_decoration: null,
            discriminator: "",
            public_flags: 128,
            flags: 128,
          },
      flags: 0,
      team: null,
    });
  },
};
