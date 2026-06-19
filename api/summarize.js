import { applyCors } from "./http-utils.js";

const SUMMARY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "possibleMajors", "interests", "strengths", "weaknesses", "keywords", "evidence"],
  properties: {
    summary: { type: "string" },
    possibleMajors: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: { type: "string" },
    },
    interests: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: { type: "string" },
    },
    strengths: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: { type: "string" },
    },
    weaknesses: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: { type: "string" },
    },
    keywords: {
      type: "array",
      minItems: 1,
      maxItems: 12,
      items: { type: "string" },
    },
    evidence: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: { type: "string" },
    },
  },
};

function cleanInput(text) {
  return String(text || "").replace(/\s+/g, " ").trim().slice(0, 12000);
}

export default async function handler(request, response) {
  if (applyCors(request, response)) return;

  if (request.method !== "POST") {
    response.status(405).json({ error: "Use POST." });
    return;
  }

  const text = cleanInput(request.body?.text);

  if (!text) {
    response.status(400).json({ error: "No text provided." });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    response.status(501).json({ error: "OPENAI_API_KEY is not configured." });
    return;
  }

  const apiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "You analyze student resumes, activity lists, essays, and brag sheets. Identify academic interests or possible majors, strengths, weaknesses or gaps, keywords, and evidence. Be concrete and useful. Do not estimate admission chances.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "student_interest_summary",
          strict: true,
          schema: SUMMARY_SCHEMA,
        },
      },
    }),
  });

  if (!apiResponse.ok) {
    const detail = await apiResponse.text();
    response.status(502).json({ error: "OpenAI request failed.", detail: detail.slice(0, 400) });
    return;
  }

  const data = await apiResponse.json();
  const output = data.output_text || data.output?.[0]?.content?.[0]?.text;

  if (!output) {
    response.status(502).json({ error: "OpenAI returned no summary." });
    return;
  }

  response.status(200).json(JSON.parse(output));
}
