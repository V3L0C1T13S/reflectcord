/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
export function removeNull(obj: any) {
  for (const curr in obj) {
    if (obj[curr] === null) {
      console.log(`removing ${curr}`);
      delete obj[curr];
    }
  }

  return obj;
}
