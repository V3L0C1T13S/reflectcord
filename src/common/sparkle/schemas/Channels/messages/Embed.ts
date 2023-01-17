import { Tuple } from "../../../../utils/check";

export const EmbedFooterSchema = {
  text: String,
  $icon_url: String,
  $proxy_icon_url: String,
};

export const EmbedAuthorSchema = {
  name: String,
  $url: String,
  $icon_url: String,
  $proxy_icon_url: String,
};

export const EmbedFieldSchema = {
  name: new Tuple(String, Number),
  value: new Tuple(String, Number),
  $inline: Boolean,
};

export const EmbedMediaSchema = {
  $proxy_url: String,
  $height: String,
  $width: String,
};

export const EmbedImageSchema = {
  ...EmbedMediaSchema,
  url: String,
};

export const EmbedVideoSchema = {
  ...EmbedMediaSchema,
  $url: String,
};

export const EmbedSchema = {
  $title: String,
  $type: String,
  $description: String,
  $url: String,
  $timestamp: String,
  $color: new Tuple(String, Number),
  $footer: EmbedFooterSchema,
  $image: EmbedImageSchema,
  $thumbnail: Object,
  $video: EmbedVideoSchema,
  $provider: Object,
  $author: EmbedAuthorSchema,
  $fields: [EmbedFieldSchema],
};
