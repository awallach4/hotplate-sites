/**
 * Generates a random alphanumeric string.
 * @function generateString
 * @param {number} length The length of the string.
 * @returns {string} A random alphanumeric string.
 */
export function generateString(length = 20): string {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charLength = characters.length;
  let i: number;
  for (i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charLength));
  }
  return result;
}
