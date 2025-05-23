// Type assertion function for API keys
function assertApiKey(value: string | undefined, keyName: string): string {
  if (!value || typeof value !== "string" || value.trim() === "") {
    throw new Error(`${keyName} is not defined`);
  }
  return value;
}

export { assertApiKey };
