import { MAX_HTML_BYTES, getStaySource, type StaySource } from "./staySources";

export class ScrapeError extends Error {}

export async function fetchStayHtml(source: StaySource, token: string) {
  if (!token.trim()) throw new ScrapeError("missing_token");
  if (getStaySource(source.slug)?.url !== source.url) {
    throw new ScrapeError("unconfigured_source");
  }
  const url = new URL("https://api.scrape.do/");
  url.search = new URLSearchParams({
    token,
    url: source.url,
    render: "false",
    super: "false",
    disableRetry: "true",
    disableRedirection: "true",
    timeout: "20000",
  }).toString();
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(25_000),
      redirect: "error",
    });
    if (!response.ok) throw new ScrapeError(`http_${response.status}`);
    const type = response.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml\+xml/i.test(type)) {
      throw new ScrapeError("not_html");
    }
    if (Number(response.headers.get("content-length")) > MAX_HTML_BYTES) {
      await response.body?.cancel();
      throw new ScrapeError("response_too_large");
    }
    const reader = response.body?.getReader();
    if (!reader) throw new ScrapeError("empty_response");
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > MAX_HTML_BYTES) throw new ScrapeError("response_too_large");
        chunks.push(chunk.value);
      }
    } finally {
      await reader.cancel();
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new TextDecoder().decode(bytes);
  } catch (error) {
    // Fetch errors can include the authenticated URL: never expose their text.
    if (error instanceof ScrapeError) throw error;
    throw new ScrapeError("network_or_timeout");
  }
}
