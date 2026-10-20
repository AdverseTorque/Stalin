import { describe, expect, it } from "vitest";
import { COUNTRIES } from "@/lib/geo/countries";
import { detectCountry, getCountryByFips } from "@/lib/geo/detect";
import { countryAtPoint } from "@/lib/geo/pointInCountry";
import { MAP_HEIGHT, MAP_WIDTH, project } from "@/lib/geo/projection";
import { placeFromText } from "@/lib/sources/place";

const name = (text: string) => detectCountry(text)?.name ?? null;

describe("detectCountry", () => {
  it("matches country names", () => {
    expect(name("Floods hit Bangladesh again")).toBe("Bangladesh");
    expect(name("Talks in Armenia stall")).toBe("Armenia");
  });

  it("matches nationality words (previously dropped ~40% of BBC/UN items)", () => {
    expect(name("French protests: is it game over for Macron?")).toBe("France");
    expect(name("Australian MP remains in critical condition")).toBe("Australia");
    expect(name("Albanian protesters clash with police")).toBe("Albania");
    expect(name("South Sudanese refugees cross border")).toBe("South Sudan");
  });

  it("picks the EARLIEST mention, not the longest name", () => {
    expect(name("UAE and India held talks on trade")).toBe("UAE");
    expect(name("India and the United Arab Emirates held talks")).toBe("India");
  });

  it("does not read the pronoun 'us' as the United States", () => {
    expect(name("Tell us what you think about the budget")).toBeNull();
    expect(name("US imposes new tariffs")).toBe("United States");
    expect(name("U.S. imposes new tariffs")).toBe("United States");
  });

  it("is case-sensitive for normal text (turkey the bird is not Turkey)", () => {
    expect(name("How to roast a turkey for the holidays")).toBeNull();
    expect(name("Turkey hosts peace talks")).toBe("Turkey");
  });

  it("falls back to case-insensitive matching for ALL-CAPS headlines", () => {
    expect(name("PRESIDENT OF INDIA GREETS NATION")).toBe("India");
  });

  it("ignores blocker phrases", () => {
    expect(name("Latin American leaders meet in summit")).toBeNull();
    expect(name("Cyclone forms over the Indian Ocean")).toBeNull();
    // ...but still finds a real country later in the same text
    expect(name("Latin American leaders meet in Brazil")).toBe("Brazil");
  });

  it("returns null when no country is named", () => {
    expect(name("Mission blasts off for Mars")).toBeNull();
  });
});

describe("country gazetteer", () => {
  it("has exactly one entry per ISO code", () => {
    const codes = COUNTRIES.map((c) => c.iso2);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("covers the whole world, not just the hand-checked list", () => {
    expect(COUNTRIES.length).toBeGreaterThan(200);
  });

  it("keeps hand-checked display names and capital coordinates", () => {
    const us = COUNTRIES.find((c) => c.iso2 === "US")!;
    expect(us.name).toBe("United States");
    const india = COUNTRIES.find((c) => c.iso2 === "IN")!;
    expect(india.lat).toBeCloseTo(28.6139, 3); // New Delhi, not the geographic centroid
  });
});

describe("getCountryByFips (GDELT uses FIPS 10-4, not ISO)", () => {
  it.each([
    ["IN", "India"],
    ["GM", "Germany"], // ISO is DE
    ["AU", "Austria"], // ISO "AU" is Australia!
    ["AS", "Australia"],
    ["IS", "Israel"], // missing from Natural Earth, filled from the verified FIPS list
    ["NO", "Norway"], // same
    ["WE", "Palestine"],
    ["GZ", "Palestine"],
    ["HA", "Haiti"], // a country outside the old 70-entry list
  ])("%s -> %s", (fips, expected) => {
    expect(getCountryByFips(fips)?.name).toBe(expected);
  });

  it("returns null for unknown codes", () => {
    expect(getCountryByFips("ZZ")).toBeNull();
  });
});

describe("countryAtPoint — official Indian boundaries", () => {
  it.each([
    ["Srinagar", 34.08, 74.8, "India"],
    ["Muzaffarabad (PoK)", 34.37, 73.47, "India"],
    ["Gilgit (Gilgit-Baltistan)", 35.92, 74.31, "India"],
    ["Aksai Chin", 35.2, 79.3, "India"],
    ["Itanagar (Arunachal)", 27.08, 93.6, "India"],
    ["Lahore", 31.55, 74.34, "Pakistan"],
    ["Lhasa", 29.65, 91.1, "China"],
    ["Paris", 48.86, 2.35, "France"],
  ])("%s", (_label, lat, lng, expected) => {
    expect(countryAtPoint(lat, lng)?.name).toBe(expected);
  });

  it("returns null in open ocean", () => {
    expect(countryAtPoint(0, -30)).toBeNull();
  });
});

describe("placeFromText", () => {
  it("uses the source's default country only when the text names none", () => {
    expect(placeFromText("Monsoon session begins", "India").country).toBe("India");
    expect(placeFromText("Japan and India sign pact", "India").country).toBe("Japan");
  });

  it("keeps unplaceable items with no coordinates instead of dropping them", () => {
    const p = placeFromText("Mission blasts off for Mars");
    expect(p.country).toBe("Global");
    expect(p.lat).toBeNull();
    expect(p.lng).toBeNull();
  });
});

describe("map projection (must match scripts/build-world-map.mjs)", () => {
  it("maps the corners of the cropped map", () => {
    expect(project(84, -180)).toEqual({ x: 0, y: 0 });
    const br = project(-58, 180);
    expect(br.x).toBeCloseTo(MAP_WIDTH);
    expect(br.y).toBeCloseTo(MAP_HEIGHT);
  });

  it("puts lng 0 at the horizontal centre", () => {
    expect(project(0, 0).x).toBeCloseTo(MAP_WIDTH / 2);
  });
});
