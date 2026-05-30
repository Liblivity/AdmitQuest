const SCORE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["scores", "verdict", "quests"],
  properties: {
    scores: {
      type: "object",
      additionalProperties: false,
      required: [
        "academicPower",
        "leadership",
        "impact",
        "majorAlignment",
        "narrativeStrength",
      ],
      properties: {
        academicPower: { type: "integer", minimum: 0, maximum: 100 },
        leadership: { type: "integer", minimum: 0, maximum: 100 },
        impact: { type: "integer", minimum: 0, maximum: 100 },
        majorAlignment: { type: "integer", minimum: 0, maximum: 100 },
        narrativeStrength: { type: "integer", minimum: 0, maximum: 100 },
      },
    },
    verdict: { type: "string" },
    quests: {
      type: "array",
      minItems: 3,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "detail", "reward"],
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          reward: { type: "string" },
        },
      },
    },
  },
};

function clampProfile(profile) {
  return {
    grade: Number(profile.grade) || 11,
    major: String(profile.major || "Undecided").slice(0, 80),
    gpa: Number(profile.gpa) || 0,
    rigor: Number(profile.rigor) || 0,
    activities: String(profile.activities || "").slice(0, 3000),
    awards: String(profile.awards || "").slice(0, 2000),
    targetTier: String(profile.targetTier || "Top 50").slice(0, 80),
  };
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Use POST." });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    response.status(501).json({ error: "AI evaluator is not configured." });
    return;
  }

  const profile = clampProfile(request.body || {});

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
            "You are AdmitQuest's evaluator. Score a college applicant's profile from 0 to 100. Be honest, calibrated, and useful. Do not estimate admission probability. Elite, verified achievements such as international olympiad medals, national championships, major research recognition, or major public impact should strongly affect the relevant scores. Generic membership should be weak. Return practical quests.",
        },
        {
          role: "user",
          content: JSON.stringify(profile),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "admitquest_evaluation",
          strict: true,
          schema: SCORE_SCHEMA,
        },
      },
    }),
  });

  if (!apiResponse.ok) {
    const errorText = await apiResponse.text();
    response.status(502).json({ error: "OpenAI request failed.", detail: errorText.slice(0, 300) });
    return;
  }

  const data = await apiResponse.json();
  const output = data.output_text || data.output?.[0]?.content?.[0]?.text;

  if (!output) {
    response.status(502).json({ error: "OpenAI returned no structured output." });
    return;
  }

  response.status(200).json(JSON.parse(output));
}
