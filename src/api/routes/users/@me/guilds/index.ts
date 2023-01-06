/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const servers = await res.rvAPIWrapper.servers.getServers();

    res.json(servers.map((x) => x.discord));
  },
};
