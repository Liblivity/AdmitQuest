export function cleanText(value, maxLength = 4000) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function makeSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export function extractEmails(text) {
  return [...new Set(String(text || "").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])];
}

export async function searchWeb(query, maxResults = 8) {
  if (process.env.TAVILY_API_KEY) {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        search_depth: "advanced",
        max_results: maxResults,
        include_answer: false,
        include_raw_content: false,
      }),
    });

    if (!response.ok) throw new Error("Tavily search failed.");
    const data = await response.json();
    return (data.results || []).map((result) => ({
      title: result.title || "",
      url: result.url || "",
      snippet: result.content || "",
      source: "tavily",
    }));
  }

  if (process.env.SERPAPI_KEY) {
    const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_KEY}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error("SerpAPI search failed.");
    const data = await response.json();
    return (data.organic_results || []).slice(0, maxResults).map((result) => ({
      title: result.title || "",
      url: result.link || "",
      snippet: result.snippet || "",
      source: "serpapi",
    }));
  }

  throw new Error("No search API configured.");
}

export async function openaiJson({ system, user, schema, name }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      text: {
        format: {
          type: "json_schema",
          name,
          strict: true,
          schema,
        },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail.slice(0, 500));
  }

  const data = await response.json();
  const output = data.output_text || data.output?.[0]?.content?.[0]?.text;
  if (!output) throw new Error("OpenAI returned no structured output.");
  return JSON.parse(output);
}
