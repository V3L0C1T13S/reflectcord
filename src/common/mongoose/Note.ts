import mongoose from "mongoose";

export interface INote {
  user_id: string,
  note_user_id: string,
  note: string,
}

export interface IUserNote extends mongoose.Document {
  owner_id: string,
  note: INote,
}

export const UserNoteSchema = new mongoose.Schema({
  owner_id: { type: String, required: true },
  note: {
    type: {
      user_id: { type: String, required: true },
      note_user_id: { type: String, required: true }, // TODO: remove this from DB
      note: { type: String, required: true },
    },
    required: true,
  },
});

export const UserNote = mongoose.model<IUserNote>("UserNote", UserNoteSchema);
