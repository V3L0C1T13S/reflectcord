/* eslint-disable no-redeclare */
export const ResumeSchema = {
  token: String,
  session_id: String,
  $seq: Number,
};

export interface ResumeSchema {
  token: string,
  session_id: string,
  seq?: number | null,
}
