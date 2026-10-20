import { describe, expect, it } from "vitest";
import { parsePreviewHtml, splitPost } from "@/lib/sources/adapters/telegram-public";
import { channelSelected } from "@/lib/sources/adapters/telegram-mtproto";

// Shaped like a real t.me/s/<channel> page (structure verified live):
// data-post on each post, a .tgme_widget_message_text block, <time datetime>.
const FIXTURE = `
<meta property="og:title" content="Example &amp; News">
<div class="tgme_widget_message_wrap"><div class="tgme_widget_message" data-post="examplenews/101">
  <div class="tgme_widget_message_text js-message_text" dir="auto"><b>Parliament passes data bill</b><br/><br/>The bill now goes to the Rajya Sabha &amp; then for assent.</div>
  <a class="tgme_widget_message_date"><time datetime="2026-10-20T08:00:00+00:00" class="time">08:00</time></a>
</div></div>
<div class="tgme_widget_message_wrap"><div class="tgme_widget_message" data-post="examplenews/102">
  <div class="tgme_widget_message_photo_wrap"></div>
  <a class="tgme_widget_message_date"><time datetime="2026-10-20T09:00:00+00:00" class="time">09:00</time></a>
</div></div>
<div class="tgme_widget_message_wrap"><div class="tgme_widget_message" data-post="examplenews/103">
  <div class="tgme_widget_message_text js-message_text" dir="auto">Single-line update from Kyiv</div>
  <a class="tgme_widget_message_date"><time datetime="2026-10-20T10:00:00+00:00" class="time">10:00</time></a>
</div></div>`;

describe("parsePreviewHtml", () => {
  const { channelTitle, posts } = parsePreviewHtml(FIXTURE);

  it("reads the channel title (entities decoded)", () => {
    expect(channelTitle).toBe("Example & News");
  });

  it("extracts text posts and skips media-only posts", () => {
    expect(posts.map((p) => p.post)).toEqual(["examplenews/101", "examplenews/103"]);
  });

  it("splits on <br> into lines and decodes entities", () => {
    expect(posts[0].lines).toEqual([
      "Parliament passes data bill",
      "The bill now goes to the Rajya Sabha & then for assent.",
    ]);
    expect(posts[0].publishedAt?.toISOString()).toBe("2026-10-20T08:00:00.000Z");
  });
});

describe("splitPost", () => {
  it("first line is the headline, the rest the summary", () => {
    expect(splitPost(["Headline", "More detail", "Even more"])).toEqual({
      title: "Headline",
      summary: "More detail Even more",
    });
  });

  it("truncates long headlines on a word boundary (stores a snippet, never the full post)", () => {
    const { title } = splitPost(["word ".repeat(60).trim()]);
    expect(title.length).toBeLessThanOrEqual(161);
    expect(title.endsWith("…")).toBe(true);
    expect(title).not.toMatch(/wor…$/); // didn't cut mid-word
  });
});

describe("channelSelected (TELEGRAM_CHANNELS)", () => {
  it("defaults to all channels", () => {
    expect(channelSelected(undefined, "anything", "1")).toBe(true);
    expect(channelSelected("all", undefined, "1")).toBe(true);
  });

  it("matches by username (case-insensitive, optional @) or numeric id", () => {
    expect(channelSelected("@IndiaNews, 12345", "indianews", "999")).toBe(true);
    expect(channelSelected("@IndiaNews, 12345", undefined, "12345")).toBe(true);
    expect(channelSelected("@IndiaNews, 12345", "othernews", "999")).toBe(false);
  });
});
