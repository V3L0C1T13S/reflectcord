export interface Form_field {
  field_type: string;
  label: string;
  description?: any;
  required: boolean;
  values: string[];
}

export interface VerificationScreen {
  /* ISO Timestamp of what seems to be when this was created */
  version: string;
  form_fields: Form_field[];
  description: string;
}
