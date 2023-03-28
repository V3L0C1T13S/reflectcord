export function validateObject(data: any, validator: any) {
  return Object.entries(validator).every(([key, val]) => typeof data[key] === typeof val);
}

export function isAGuild(data: any) {
  return validateObject(data, {
    id: "",
    name: "",
  });
}

export function isAGuildV2(data: any) {
  return (isAGuild(data.properties) && validateObject(data, {
    id: "",
  }));
}
