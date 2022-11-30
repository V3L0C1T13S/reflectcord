export interface VideoFilter {
  /** An attachment ID */
  id: number,
  // TODO
  type: number,
  /** User ID this filter is owned by.
   * Seems to do nothing even if you leave it blank.
   * */
  user_id: number,
}

/**
 * GET /users/@me/video-filters/assets
 */
export type VideoFilterResponse = VideoFilter[];
