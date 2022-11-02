import axios, { Axios } from "axios";
import { gifBoxAPIUrl } from "../../constants";
import { Posts } from "./maps/posts";

/**
 * Very minimalistic Gifbox client for very minimalistic people.
 * ...And also those that use CommonJS, because I'm too lazy to rewrite
 * express-automatic-roots in ESM.
 */
export class GifboxClient {
  axios: Axios;

  posts = new Posts(this);

  constructor(baseURL = gifBoxAPIUrl) {
    this.axios = axios.create({
      baseURL,
    });
  }
}
