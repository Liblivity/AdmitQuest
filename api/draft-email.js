import { applyCors } from "./http-utils.js";
import { cleanText, openaiJson, searchWeb } from "./search-utils.js";

const EMAIL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["subject", "email", "professorSummary", "talkingPoints", "sources"],
  properties: {
    subject: { type: "string" },
    email: { type: "string" },
    professorSummary: { type: "string" },
    talkingPoints: {
      type: "array",
      minItems: 2,
      maxItems: 5,
      items: { type: "string" },
    },
    sources: {
      type: "array",
      maxItems: 6,
      items: { type: "string" },
    },
  },
};

export default async function handler(request, response) {
  if (applyCors(request, response)) return;

  if (request.method !== "POST") {
    response.status(405).json({ error: "Use POST." });
    return;
  }

  const { professor, studentText, analysis } = request.body || {};
  if (!professor?.name) {
    response.status(400).json({ error: "Professor is required." });
    return;
  }

  try {
    const query = `${professor.name} ${professor.institution || ""} ${professor.department || ""} research publications lab`;
    const researchResults =
      process.env.TAVILY_API_KEY || process.env.SERPAPI_KEY
        ? await searchWeb(query, 6).catch(() => [])
        : [];

    const draft = await openaiJson({
      name: "cold_email_draft",
      schema: EMAIL_SCHEMA,
      system:
        "Draft a concise, respectful cold email from a high school student to a professor. Tailor it to the student's background and professor's research. Do not invent professor facts; use only provided search evidence. The email should ask for a possible conversation, advice, or opportunity to contribute, not demand a position.",
      user: JSON.stringify({
        professor,
        studentAnalysis: analysis,
        studentResume: cleanText(studentText, 6000),
        professorResearchResults: researchResults,
      }),
    });

    response.status(200).json(draft);
  } catch (error) {
    response.status(502).json({ error: "Email draft failed.", detail: error.message });
  }
}
