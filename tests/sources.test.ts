import { describe, expect, it } from "vitest";
import { decodeHtmlEntities, htmlToText, parsePublished } from "@/lib/sources/text";
import { isOffTopic } from "@/lib/sources/relevance";
import { toIsoUtc } from "@/lib/sources/adapters/newsdata";
import { COL, parseExportCsv, parseGdeltTimestamp, previousExportUrls } from "@/lib/sources/adapters/gdelt";

describe("decodeHtmlEntities", () => {
  it("decodes named and numeric entities", () => {
    expect(decodeHtmlEntities("Tom &amp; Jerry &#8217;s &#x2014; &quot;x&quot;")).toBe("Tom & Jerry ’s — \"x\"");
  });

  it("decodes in a single pass (no double-decoding)", () => {
    // The old decoder replaced &amp; first and then decoded again, turning
    // the literal text "&lt;" (encoded as &amp;lt;) into "<".
    expect(decodeHtmlEntities("&amp;lt;b&amp;gt;")).toBe("&lt;b&gt;");
  });

  it("leaves unknown entities untouched", () => {
    expect(decodeHtmlEntities("&notarealentity;")).toBe("&notarealentity;");
  });
});

describe("htmlToText", () => {
  it("strips tags, decodes entities and collapses whitespace", () => {
    expect(htmlToText("<p>Hello&nbsp;<b>world</b></p>\n\n<br/>again")).toBe("Hello world again");
  });

  it("inline tags don't add spaces; block tags separate words", () => {
    expect(htmlToText("Now has a <b>Rich Text Editor</b>.")).toBe("Now has a Rich Text Editor.");
    expect(htmlToText("<p>One</p><p>Two</p>")).toBe("One Two");
    expect(htmlToText("line<br>break")).toBe("line break");
  });
});

describe("parsePublished", () => {
  const now = Date.UTC(2026, 9, 20, 12, 0, 0);

  it("parses valid dates", () => {
    expect(parsePublished("2026-10-20T10:00:00Z", now)?.toISOString()).toBe("2026-10-20T10:00:00.000Z");
  });

  it("returns null for missing or garbage dates", () => {
    expect(parsePublished(undefined, now)).toBeNull();
    expect(parsePublished("not a date", now)).toBeNull();
  });

  it("clamps future timestamps to now", () => {
    expect(parsePublished("2026-10-21T00:00:00Z", now)?.getTime()).toBe(now);
  });
});

describe("NewsData.io toIsoUtc", () => {
  it("treats the zone-less pubDate as UTC (not local time)", () => {
    expect(toIsoUtc("2026-10-08 15:04:11", "UTC")).toBe("2026-10-08T15:04:11Z");
    expect(new Date(toIsoUtc("2026-10-08 15:04:11", "UTC")!).getUTCHours()).toBe(15);
  });

  it("refuses to guess an unknown timezone", () => {
    expect(toIsoUtc("2026-10-08 15:04:11", "Asia/Kolkata")).toBeUndefined();
  });

  it("passes through missing values", () => {
    expect(toIsoUtc(undefined, "UTC")).toBeUndefined();
  });
});

describe("isOffTopic", () => {
  it.each([
    "Kohli's century powers India to win in third ODI",
    "Bollywood star's new film breaks box office records",
    "Your horoscope for today",
  ])("filters: %s", (t) => expect(isOffTopic(t)).toBe(true));

  it.each([
    "Parliament passes the data protection bill",
    "India and China hold border talks",
    "RBI keeps repo rate unchanged",
    "A test of resolve for the coalition", // "test" alone is not a sport term
  ])("keeps: %s", (t) => expect(isOffTopic(t)).toBe(false));
});

describe("GDELT export parsing", () => {
  function row(overrides: Partial<Record<keyof typeof COL, string>>): string {
    const cols = new Array(61).fill("");
    const defaults: Partial<Record<keyof typeof COL, string>> = {
      EventRootCode: "19",
      GoldsteinScale: "-10",
      NumMentions: "25",
      ActionGeo_FullName: "Srinagar, Jammu and Kashmir, India",
      ActionGeo_CountryCode: "IN",
      ActionGeo_Lat: "34.08",
      ActionGeo_Long: "74.8",
      DATEADDED: "20261020101500",
      SOURCEURL: "https://example.com/story",
    };
    for (const [k, v] of Object.entries({ ...defaults, ...overrides })) cols[COL[k as keyof typeof COL]] = v;
    return cols.join("\t");
  }

  it("reads the documented columns", () => {
    const [r] = parseExportCsv(row({}));
    expect(r).toMatchObject({
      lat: 34.08,
      lng: 74.8,
      numMentions: 25,
      root: "19",
      fipsCode: "IN",
      goldstein: -10,
      sourceUrl: "https://example.com/story",
    });
    expect(r.dateAdded?.toISOString()).toBe("2026-10-20T10:15:00.000Z");
  });

  it("skips ungeocoded, low-mention and URL-less rows", () => {
    const csv = [
      row({ ActionGeo_Lat: "", ActionGeo_Long: "" }),
      row({ NumMentions: "3" }),
      row({ SOURCEURL: "" }),
      row({ SOURCEURL: "not-a-url" }),
      row({}),
    ].join("\n");
    expect(parseExportCsv(csv)).toHaveLength(1);
  });

  it("keeps a point exactly on the equator/prime meridian (0 is a valid coordinate)", () => {
    expect(parseExportCsv(row({ ActionGeo_Lat: "0", ActionGeo_Long: "10" }))).toHaveLength(1);
  });
});

describe("parseGdeltTimestamp", () => {
  it("parses YYYYMMDDHHMMSS as UTC", () => {
    expect(parseGdeltTimestamp("20261020101500")?.toISOString()).toBe("2026-10-20T10:15:00.000Z");
  });
  it("rejects malformed values", () => {
    expect(parseGdeltTimestamp("2026-10-20")).toBeNull();
    expect(parseGdeltTimestamp(undefined)).toBeNull();
  });
});

describe("previousExportUrls", () => {
  it("steps back in 15-minute files, across midnight", () => {
    const urls = previousExportUrls("http://data.gdeltproject.org/gdeltv2/20261021000000.export.CSV.zip", 3);
    expect(urls).toEqual([
      "http://data.gdeltproject.org/gdeltv2/20261021000000.export.CSV.zip",
      "http://data.gdeltproject.org/gdeltv2/20261020234500.export.CSV.zip",
      "http://data.gdeltproject.org/gdeltv2/20261020233000.export.CSV.zip",
    ]);
  });
});
