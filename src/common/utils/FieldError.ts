export class FieldError extends Error {
  constructor(public code: string | number, public message: string, public errors?: any) {
    super(message);
  }
}

export function FieldErrors(fields: Record<string, { code?: string; message: string }>) {
  return new FieldError(
    50035,
    "Invalid Form Body",
    fields.map(({ message, code }) => ({
      _errors: [
        {
          message,
          code: code || "BASE_TYPE_INVALID",
        },
      ],
    })),
  );
}
