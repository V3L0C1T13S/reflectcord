/**
 * Converts a RGB color to a hex color.
 * @param rgb The RGB color to convert to hex.
 * @returns The hex color.
 */
export function rgbToHex(rgb: number): string {
  return `#${rgb.toString(16).padStart(6, "0")}`;
}

/**
 * Converts a hex color to RGB.
 * @param hex The hex color to convert to RGB.
 * @returns The RGB color.
 */
export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result || (!result[1] || !result[2] || !result[3])) return;
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

/**
 * Converts a hex color to a RGB number, for example #00ff00 will return 0x00ff00
 * @param hex The hex color to convert to RGB
 */
export function hexToRgbCode(hex: string) {
  // eslint-disable-next-line no-param-reassign
  if (hex.startsWith("#")) hex = hex.substr(1);
  if (!hex[0] || !hex[1] || !hex[2]) return;

  // eslint-disable-next-line no-param-reassign
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  return parseInt(hex, 16);
}
