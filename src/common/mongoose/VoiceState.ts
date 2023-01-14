import mongoose from "mongoose";

const VoiceStateSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  guild_id: { type: String, required: false },
  channel_id: { type: String, required: false },
  user_id: {
    type: String, required: true, immutable: true,
  },
  member: { type: Object, required: false },
  session_id: { type: String, required: true },
  deaf: { type: Boolean, required: true },
  mute: { type: Boolean, required: true },
  self_deaf: { type: Boolean, required: true },
  self_mute: { type: Boolean, required: true },
  self_stream: { type: Boolean, required: false },
  self_video: { type: Boolean, required: true },
  suppress: { type: Boolean, required: true },
  request_to_speak_timestamp: { type: String, required: false },
});

export const VoiceState = mongoose.model("VoiceState", VoiceStateSchema);
