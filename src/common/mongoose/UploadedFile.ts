import mongoose from "mongoose";

const UploadedFileSchema = new mongoose.Schema({
  _id: { type: String, required: true, immutable: true },
  autumn_id: { type: String, required: false },
  info: {
    type: {
      name: { type: String, required: true, immutable: true },
    },
    required: true,
  },
});

export const UploadedFile = mongoose.model("UploadedFile", UploadedFileSchema);
