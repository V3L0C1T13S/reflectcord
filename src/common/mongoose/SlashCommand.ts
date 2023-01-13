import mongoose from "mongoose";

const SlashCommandSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  user_id: { type: String, required: true },
});

export const SlashCommand = mongoose.model("SlashCommand", SlashCommandSchema);
