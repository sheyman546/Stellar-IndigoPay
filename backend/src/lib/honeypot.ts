
export function validateHoneypot(body: Record<string, unknown>): boolean {
  const honeypotValue = body.website;
  return (
    honeypotValue === undefined ||
    honeypotValue === null ||
    honeypotValue === ""
  );
}
