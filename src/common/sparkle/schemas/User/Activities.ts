import { Tuple } from "../../../utils/check";

export const ActivitySchema = {
  afk: Boolean,
  status: String,
  $activities: [
    {
      name: String,
      type: Number,
      $url: String,
      $created_at: Date,
      $timestamps: {
        $start: Number,
        $end: Number,
      },
      $application_id: String,
      $details: String,
      $state: String,
      $emoji: {
        $name: String,
        $id: String,
        $animated: Boolean,
      },
      $party: {
        $id: String,
        $size: [Number, Number],
      },
      $assets: {
        $large_image: String,
        $large_text: String,
        $small_image: String,
        $small_text: String,
      },
      $secrets: {
        $join: String,
        $spectate: String,
        $match: String,
      },
      $instance: Boolean,
      $flags: new Tuple(Number, String),
      // spotify and other rich presence data
      $id: String,
      $sync_id: String,
      $metadata: {
        $context_uri: String,
        $album_id: String,
        $artist_ids: [String],
      },
      $session_id: String,
    },
  ],
  $since: Number,
  $game: null,
};
