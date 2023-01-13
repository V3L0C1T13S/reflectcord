import { Resource } from "express-automatic-routes";
import { FieldErrors } from "@reflectcord/common/utils";
import { BaseTypeRequiredError } from "@reflectcord/common/sparkle";
import { discordBaseURL } from "@reflectcord/common/constants";

export default () => <Resource> {
  get: (req, res) => {
    const { platform, format } = req.query;

    if (!platform) {
      throw FieldErrors({
        platform: BaseTypeRequiredError,
      });
    }

    res.redirect(`${discordBaseURL}/download?platform=${platform}${format ? `&format=${format}` : ""}`);
  },
};
