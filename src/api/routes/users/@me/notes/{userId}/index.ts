/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { HTTPError } from "../../../../../../common/utils";
import { fromSnowflake } from "../../../../../../common/models/util";
import { DbManager } from "../../../../../../common/db";

export type noteRequest = {
  note: string,
};

export type noteResponse = {
  user_id: string,
  note_user_id: string,
  note: string,
}

const notes = DbManager.client.db("reflectcord")
  .collection("notes");

export default (express: Application) => <Resource> {
  get: (req, res) => {
    // FIXME
    throw new HTTPError("Unknown User", 10013);
  },
  put: async (req, res) => {
    const { userId } = req.params;
    if (!userId) throw new HTTPError("ID cannot be empty", 244);

    // FIXME: this lets you make notes on anything with a valid snowflake.
    // Not a big issue ATM, but just know that its a problem that exists.
    const ulid = fromSnowflake(userId);
    if (!ulid) throw new HTTPError("User does not exist.", 400);
  },
};
