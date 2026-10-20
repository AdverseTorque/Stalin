// Pluggable LLM client — defaults to Groq (free tier) per the brief;
// switch providers with LLM_PROVIDER=anthropic (or add another case below)
// without touching any caller. Model IDs verified live against each
// provider's own docs when this was written; re-check before relying on a
// model ID that's been in production a while, since both providers rotate
// their lineups.
export interface GenerateTextOptions {
  system: string;
  prompt: string;
  maxTokens?: number;
}

export async function generateText(opts: GenerateTextOptions): Promise<string> {
  const provider = process.env.LLM_PROVIDER || "groq";
  switch (provider) {
    case "groq":
      return generateWithGroq(opts);
    case "anthropic":
      return generateWithAnthropic(opts);
    default:
      throw new Error(`Unknown LLM_PROVIDER "${provider}" — expected "groq" or "anthropic"`);
  }
}

async function generateWithGroq({ system, prompt, maxTokens = 800 }: GenerateTextOptions): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set");
  // Verified live against this account's actual GET /openai/v1/models
  // response, not just docs — Groq's free-tier lineup changes fast enough
  // that the docs/console page and a given account's real access can
  // disagree (llama-3.3-70b-versatile, the model initially chosen from the
  // docs, 404'd here even though docs listed it as current). Re-check
  // against /models directly before assuming any model id still works.
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  // gpt-oss is a reasoning model: its hidden "reasoning" trace is deducted
  // from the same max_tokens budget as the visible answer — verified live
  // (a 500-token budget on a long prompt came back with an *empty* content
  // field because reasoning alone consumed it). "low" effort keeps that
  // trace short, leaving the budget for the actual answer, and also helps
  // with the free tier's tight tokens-per-minute limit. Only gpt-oss models
  // support this field (per Groq's docs) — only send it for those.
  const isGptOss = model.includes("gpt-oss");

  const requestBody = JSON.stringify({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
    max_tokens: maxTokens,
    temperature: 0.4,
    ...(isGptOss ? { reasoning_effort: "low" } : {}),
  });

  const doRequest = () =>
    fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: requestBody,
    });

  let res = await doRequest();
  if (res.status === 429) {
    // Free tier's tokens-per-minute limit is tight enough that back-to-back
    // calls for several regions in one run can legitimately hit it — Groq's
    // own error message states exactly how long to wait, so honor that
    // instead of guessing, then retry once.
    const body = await res.text().catch(() => "");
    const waitSeconds = Number(body.match(/try again in ([\d.]+)s/)?.[1] ?? 5);
    await new Promise((resolve) => setTimeout(resolve, (waitSeconds + 0.5) * 1000));
    res = await doRequest();
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groq API returned ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq API returned no content");
  return String(content).trim();
}

async function generateWithAnthropic({ system, prompt, maxTokens = 800 }: GenerateTextOptions): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Anthropic API returned ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = await res.json();
  const content = json?.content?.[0]?.text;
  if (!content) throw new Error("Anthropic API returned no content");
  return String(content).trim();
}
