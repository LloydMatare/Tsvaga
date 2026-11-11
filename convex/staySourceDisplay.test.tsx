// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StaySourceInfo } from "../components/stay-source-info";
import type { SourceInfo } from "./lib/staySourceSchema";

describe("source information display", () => {
  it("shows unverified fields explicitly before the first refresh", () => {
    const html = renderToStaticMarkup(
      <StaySourceInfo sourceUrl="https://pamusha.com/" name="Pamusha Lodge" />,
    );
    expect(html).toContain("Awaiting the first successful refresh");
    expect(html).toContain("Not published or not yet verified");
    expect(html).toContain("not check-in times");
  });
  it("keeps external scores and advertised prices explicitly attributed", () => {
    const info: SourceInfo = {
      url: "https://pamusha.com/",
      provider: "Fixture provider",
      cycle: "2026-11-01",
      status: "partial",
      lastSuccessAt: 1794398400000,
      data: {
        rating: { value: 8.7, best: 10, worst: 0, count: 123 },
        pricing: [{ text: "USD 180 per person, breakfast included" }],
        reviews: [
          {
            key: "fixture",
            author: "Fixture Reviewer",
            text: "<script>not executable</script>",
            url: "https://pamusha.com/",
          },
        ],
        phone: "+263832844367",
        geo: { lat: -17.92, lng: 25.83 },
      },
      provenance: {
        rating: { url: "https://pamusha.com/", checkedAt: 1794398400000 },
      },
    };
    const html = renderToStaticMarkup(
      <StaySourceInfo info={info} sourceUrl={info.url} name="Pamusha Lodge" />,
    );
    expect(html).toContain("Fixture provider");
    expect(html).toContain("8.7 / 10");
    expect(html).toContain("not a Tsvaga-verified guest score");
    expect(html).toContain("not Tsvaga booking quotes");
    expect(html).toContain("Fixture Reviewer");
    expect(html).toContain("&lt;script&gt;not executable&lt;/script&gt;");
    expect(html).toContain("tel:+263832844367");
    expect(html).toContain("https://www.google.com/maps/search/");
    expect(html).toContain("individual check dates");
  });
});
