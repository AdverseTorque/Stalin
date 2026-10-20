import { describe, expect, it } from "vitest";
import { classifyCategory } from "@/lib/classify/category";
import { classifySeverityFromGoldstein, classifySeverityFromText } from "@/lib/classify/severity";
import { getAgentRegion } from "@/lib/agents/regions";
import { findRelatedEvents } from "@/lib/relatedEvents";
import type { SitrepEvent } from "@/lib/types";

describe("classifyCategory", () => {
  it("classifies by content keywords", () => {
    expect(classifyCategory("Thousands protest outside parliament", "France")).toBe("unrest");
    expect(classifyCategory("Militant attack kills soldiers", "Pakistan")).toBe("conflict");
    expect(classifyCategory("Central bank raises interest rate", "United States")).toBe("economics");
    expect(classifyCategory("Leaders sign bilateral treaty at summit", "Japan")).toBe("geopolitics");
  });

  it("only falls back to 'india' when nothing else matches", () => {
    expect(classifyCategory("Lok Sabha passes the bill", "India")).toBe("india");
    expect(classifyCategory("Monsoon arrives early this year", "India")).toBe("india");
    // A conflict story located in India is still conflict, not "Indian politics".
    expect(classifyCategory("Militant attack in the valley", "India")).toBe("conflict");
  });
});

describe("severity", () => {
  it("maps the Goldstein scale", () => {
    expect(classifySeverityFromGoldstein(-10)).toBe("critical");
    expect(classifySeverityFromGoldstein(-5)).toBe("high");
    expect(classifySeverityFromGoldstein(0)).toBe("medium");
    expect(classifySeverityFromGoldstein(5)).toBe("low");
  });

  it("uses text keywords for other sources", () => {
    expect(classifySeverityFromText("12 killed in blast")).toBe("critical");
    expect(classifySeverityFromText("Clash at the border")).toBe("high");
    expect(classifySeverityFromText("Unions announce strike")).toBe("medium");
    expect(classifySeverityFromText("New museum opens")).toBe("low");
  });
});

describe("getAgentRegion", () => {
  it.each([
    ["India", "Asia", "south_asia"],
    ["Pakistan", "Asia", "south_asia"],
    ["Iran", "Asia", "mena"],
    ["Egypt", "Africa", "mena"], // MENA beats the continent
    ["Kenya", "Africa", "sub_saharan_africa"],
    ["Mexico", "North America", "latin_america"],
    ["Canada", "North America", "north_america"],
    ["Japan", "Asia", "asia"],
    ["France", "Europe", "europe"],
    ["Australia", "Oceania", "oceania"],
  ])("%s -> %s", (country, continent, expected) => {
    expect(getAgentRegion(country, continent)).toBe(expected);
  });

  it("returns null for unplaced items", () => {
    expect(getAgentRegion("Global", "Global")).toBeNull();
  });
});

describe("findRelatedEvents", () => {
  const ev = (id: string, category: SitrepEvent["category"], country: string, tags: string[] = []): SitrepEvent => ({
    id,
    title: id,
    summary: "",
    source: "test",
    url: `https://example.com/${id}`,
    publishedAt: "2026-10-20T00:00:00Z",
    category,
    severity: "low",
    lat: 0,
    lng: 0,
    country,
    continent: "Asia",
    tags,
  });

  it("ranks by shared category + country, excludes the item itself and unrelated items", () => {
    const target = ev("t", "conflict", "India");
    const pool = [target, ev("a", "conflict", "India"), ev("b", "conflict", "Japan"), ev("c", "economics", "Brazil")];
    const related = findRelatedEvents(target, pool).map((e) => e.id);
    expect(related).toEqual(["a", "b"]);
  });
});
