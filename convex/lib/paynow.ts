export type PaynowFields = Record<string, string>;

export async function sha512HexUpper(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-512", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export async function paynowHash(
  values: string[],
  integrationKey: string,
): Promise<string> {
  return sha512HexUpper(`${values.join("")}${integrationKey}`);
}

export function parsePaynowResponse(body: string): PaynowFields {
  const params = new URLSearchParams(body);
  const fields: PaynowFields = {};
  for (const [key, value] of params.entries()) {
    fields[key.toLowerCase()] = value;
  }
  return fields;
}

export async function verifyPaynowHash(
  body: string,
  integrationKey: string,
): Promise<{ valid: boolean; fields: PaynowFields }> {
  const fields = parsePaynowResponse(body);
  const received = fields.hash?.toUpperCase();
  if (!received) return { valid: false, fields };

  const params = new URLSearchParams(body);
  const values: string[] = [];
  for (const [key, value] of params.entries()) {
    if (key.toLowerCase() === "hash") continue;
    values.push(value);
  }

  const expected = await paynowHash(values, integrationKey);
  return { valid: expected === received, fields };
}

export function toPaynowAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}
