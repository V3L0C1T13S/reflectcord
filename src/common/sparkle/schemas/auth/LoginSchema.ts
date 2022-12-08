export interface LoginSchema {
  login: string;
  password: string;
  undelete?: boolean;
  captcha_key?: string;
  login_source?: string;
  gift_code_sku_id?: string;
}

export interface MFALoginSchema {
  code: string,
  ticket: string,
}
