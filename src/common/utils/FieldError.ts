/*
  Fosscord: A FOSS re-implementation and extension of the Discord.com backend.
  Copyright (C) 2023 Fosscord and Fosscord Contributors

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published
  by the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

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
