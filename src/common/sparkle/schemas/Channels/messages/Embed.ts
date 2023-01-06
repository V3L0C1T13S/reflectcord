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
  name: String,
  value: String,
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
  $color: String,
  $footer: EmbedFooterSchema,
  $image: EmbedImageSchema,
  $thumbnail: Object,
  $video: EmbedVideoSchema,
  $provider: Object,
  $author: EmbedAuthorSchema,
  $fields: [EmbedFieldSchema],
};
