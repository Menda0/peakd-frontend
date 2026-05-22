/** Parse Nest / proxy error bodies into a short user-facing message. */
export async function readApiErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  const text = (await res.text().catch(() => "")).trim();
  if (!text) {
    if (res.status === 405) {
      return "That action is not available. Refresh the page and try again.";
    }
    return fallback;
  }
  try {
    const json = JSON.parse(text) as {
      message?: string | string[];
      error?: string;
    };
    if (Array.isArray(json.message)) {
      return json.message.join(", ");
    }
    if (typeof json.message === "string" && json.message.trim()) {
      return json.message.trim();
    }
    if (typeof json.error === "string" && json.error.trim()) {
      return json.error.trim();
    }
  } catch {
    /* plain text body */
  }
  if (text.length <= 300) {
    return text;
  }
  return fallback;
}
