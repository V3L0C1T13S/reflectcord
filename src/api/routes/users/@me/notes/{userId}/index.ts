/* eslint-disable camelcase */
import { Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { HTTPError } from "@reflectcord/common/utils";
import { fromSnowflake, toSnowflake } from "@reflectcord/common/models";
import { INote, UserNote } from "@reflectcord/common/mongoose";
import { fetchUser } from "../../../{id}";

export type noteRequest = {
  note: string,
};

export type noteResponse = INote;

export default () => <Resource> {
  get: async (req, res: Response<noteResponse>) => {
    const { userId } = req.params;
    if (!userId) throw new HTTPError("Invalid user");

    const selfUser = await res.rvAPI.get("/auth/account/");

    const note = await UserNote.findOne({ owner_id: selfUser._id, "note.user_id": userId });
    if (!note) throw new HTTPError("Unknown User", 404);

    res.json(note.note);
  },
  put: async (req: Request<any, any, noteRequest>, res: Response<noteResponse>) => {
    const { userId } = req.params;
    const { note } = req.body;
    if (!userId || typeof note !== "string") throw new HTTPError("Invalid request");

    const ulid = await fromSnowflake(userId);
    if (!ulid) throw new HTTPError("User does not exist.", 404);

    const selfUser = await res.rvAPI.get("/auth/account/");
    const user = await fetchUser(res.rvAPI, ulid);

    if (!note) {
      await UserNote.deleteOne({ owner_id: selfUser._id, "note.user_id": user.id });

      return res.json({
        user_id: user.id,
        note_user_id: await toSnowflake(selfUser._id),
        note: "",
      });
    }

    const newNote = await UserNote.findOneAndUpdate(
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

    return res.json(newNote.note);
  },
};
