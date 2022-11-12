/* eslint-disable camelcase */
import { Application, Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { fetchUser } from "../../../{id}";
import { HTTPError } from "../../../../../../common/utils";
import { fromSnowflake, toSnowflake } from "../../../../../../common/models/util";
import { DbManager } from "../../../../../../common/db";

export type noteRequest = {
  note: string,
};

export type userNote = {
  user_id: string,
  note_user_id: string,
  note: string,
}

export type noteResponse = userNote;

export type noteStorage = {
  owner_id: string,
  note: userNote,
}

const notes = DbManager.client.db("reflectcord")
  .collection<noteStorage>("notes");

export default (express: Application) => <Resource> {
  get: async (req, res: Response<noteResponse>) => {
    const { userId } = req.params;
    if (!userId) throw new HTTPError("Invalid user");

    const selfUser = await res.rvAPI.get("/auth/account/");

    const note = await notes.findOne({ owner_id: selfUser._id, "note.user_id": userId });
    if (!note) throw new HTTPError("Unknown User", 10013);

    res.json(note.note);
  },
  put: async (req: Request<any, any, noteRequest>, res: Response<noteResponse>) => {
    const { userId } = req.params;
    const { note } = req.body;
    if (!userId) throw new HTTPError("Invalid request", 422);

    const ulid = await fromSnowflake(userId);
    if (!ulid) throw new HTTPError("User does not exist.");

    const selfUser = await res.rvAPI.get("/auth/account/");
    const user = await fetchUser(res.rvAPI, ulid);

    if (!note) {
      await notes.deleteOne({ owner_id: selfUser._id, "note.user_id": user.id });

      res.json({
        user_id: user.id,
        note_user_id: await toSnowflake(selfUser._id),
        note: "",
      });
    }

    const newNote = await notes.findOneAndUpdate(
      { owner_id: selfUser._id, "note.user_id": user.id },
      {
        $setOnInsert: {
          owner_id: selfUser._id,
          "note.user_id": user.id,
          "note.note_user_id": await toSnowflake(selfUser._id),
        },
        $set: {
          "note.note": note,
        },
      },

      { upsert: true, returnDocument: "after" },
    );

    if (!newNote.value) throw new HTTPError("Note failed to update", 500);

    res.json(newNote.value.note);
  },
};
