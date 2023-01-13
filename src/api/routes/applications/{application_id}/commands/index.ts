import { Resource } from "express-automatic-routes";
import { UnimplementedError } from "@reflectcord/common/utils";
import { SlashCommand } from "@reflectcord/common/mongoose";

export default () => <Resource> {
  get: (req, res) => {
    res.json([]);
  },
  post: (req, res) => {
    throw new UnimplementedError();
  },
  put: async (req, res) => {
    const commands = req.body as any;

    const user = await res.rvAPIWrapper.users.getSelf();

    await Promise.all(commands.map((x: any) => SlashCommand.create({
      name: x.name,
      description: x.description,
      user_id: user._id,
    })));

    throw new UnimplementedError();
  },
};
