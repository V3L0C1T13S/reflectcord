// special thanks to fosscord for figuring out this gibberish
export const genLoadId = (size: Number) => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
