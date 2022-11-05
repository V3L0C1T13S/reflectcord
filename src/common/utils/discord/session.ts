function genRanHex(size: number) {
  return [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
}

export function genSessionId() {
  return genRanHex(32);
}

export function genVoiceToken() {
  return genRanHex(16);
}
