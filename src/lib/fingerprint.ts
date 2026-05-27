

export async function computeFingerprint(
  userAgent: string | null,
  ip: string,
): Promise<string> {
  const input = userAgent ? `${userAgent}|${ip}` : ip;
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
