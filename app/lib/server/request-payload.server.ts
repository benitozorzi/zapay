function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function parseRequestPayload(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const payload = await request.json();
      return isRecord(payload) ? payload : {};
    } catch {
      return {};
    }
  }

  const formData = await request.formData();
  return Object.fromEntries(formData.entries());
}
