import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchStayHtml } from "./scrapeDo";
import { getStaySource, MAX_HTML_BYTES } from "./staySources";

const source = getStaySource("pamusha-lodge-victoria-falls")!;
afterEach(() => vi.unstubAllGlobals());
describe("bounded Scrape.do client", () => {
  it("skips requests without credentials or for unknown source URLs", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(fetchStayHtml(source, "")).rejects.toThrow("missing_token");
    await expect(
      fetchStayHtml(
        { ...source, url: "https://unrelated.example/" },
        "fixture",
      ),
    ).rejects.toThrow("unconfigured_source");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("encodes the target and disables rendering, retries and premium proxies", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response("<h1>Pamusha</h1>", {
          headers: { "content-type": "text/html" },
        }),
      );
    vi.stubGlobal("fetch", fetch);
    expect(await fetchStayHtml(source, "fixture-not-a-real-token")).toContain(
      "Pamusha",
    );
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.origin).toBe("https://api.scrape.do");
    expect(url.searchParams.get("url")).toBe(source.url);
    for (const name of ["render", "super"])
      expect(url.searchParams.get(name)).toBe("false");
    expect(url.searchParams.get("disableRetry")).toBe("true");
    expect(url.searchParams.get("disableRedirection")).toBe("true");
  });
  it("sanitizes transport errors and does not propagate authenticated URLs", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockRejectedValue(new Error("request failed at authenticated URL")),
    );
    await expect(fetchStayHtml(source, "fixture")).rejects.toThrow(
      /^network_or_timeout$/,
    );
  });
  it("rejects non-HTML and oversized streams", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("{}", { headers: { "content-type": "application/json" } }),
      )
      .mockResolvedValueOnce(
        new Response("x".repeat(MAX_HTML_BYTES + 1), {
          headers: { "content-type": "text/html" },
        }),
      );
    vi.stubGlobal("fetch", fetch);
    await expect(fetchStayHtml(source, "fixture")).rejects.toThrow("not_html");
    await expect(fetchStayHtml(source, "fixture")).rejects.toThrow(
      "response_too_large",
    );
  });
});
