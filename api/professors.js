import { applyCors } from "./http-utils.js";
import { cleanText, extractEmails, makeSearchUrl, openaiJson, searchWeb } from "./search-utils.js";

const PROFESSOR_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["professors", "notes"],
  properties: {
    notes: { type: "string" },
    professors: {
      type: "array",
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "name",
          "title",
          "institution",
          "department",
          "email",
          "profileUrl",
          "compatibility",
          "compatibilityReason",
          "researchFit",
          "evidence",
        ],
        properties: {
          name: { type: "string" },
          title: { type: "string" },
          institution: { type: "string" },
          department: { type: "string" },
          email: { type: "string" },
          profileUrl: { type: "string" },
          compatibility: { type: "integer", minimum: 0, maximum: 100 },
          compatibilityReason: { type: "string" },
          researchFit: { type: "string" },
          evidence: { type: "string" },
        },
      },
    },
  },
};

function buildQueries(profile) {
  const city = cleanText(profile.city, 80);
  const country = cleanText(profile.country, 80);
  const majors = profile.analysis?.possibleMajors || [];
  const interests = profile.analysis?.interests || [];
  const focus = [...majors, ...interests].filter(Boolean).slice(0, 4);
  const baseFocus = focus.length ? focus : ["student research"];

  return baseFocus.flatMap((interest) => [
    `${interest} professor email ${city} ${country} university research lab`,
    `${interest} faculty research lab ${city} ${country} email`,
  ]).slice(0, 6);
}

function fallbackProfessorFromResult(result, index, focus, location) {
  const email = result.email || extractEmails(`${result.title} ${result.snippet}`).at(0) || "";
  const name = result.title.split(/[-|–—]/)[0]?.trim() || `Professor lead ${index + 1}`;

  return {
    name,
    title: "Faculty or research lead",
    institution: location || "Nearby institution",
    department: focus || "Research area",
    email,
    profileUrl: result.url,
    compatibility: Math.max(45, 78 - index * 4),
    compatibilityReason: `Search result appears related to ${focus || "the student's interests"}.`,
    researchFit: result.snippet || "Open profile to confirm research fit.",
    evidence: result.title,
  };
}

function htmlToSearchableText(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

async function enrichResultWithPageEmail(result) {
  if (!result.url || !/^https?:\/\//i.test(result.url)) return result;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const page = await fetch(result.url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "AdmitQuest professor email matcher",
      },
    });

    if (!page.ok) return result;
    const html = await page.text();
    const pageText = htmlToSearchableText(html).slice(0, 5000);
    const email = extractEmails(`${html} ${pageText}`).find((candidate) =>
      !/\.(png|jpe?g|gif|webp|svg)$/i.test(candidate),
    ) || "";

    return {
      ...result,
      email,
      pageText,
      snippet: [result.snippet, pageText.slice(0, 700)].filter(Boolean).join(" "),
    };
  } catch (error) {
    return result;
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(request, response) {
  if (applyCors(request, response)) return;

  if (request.method !== "POST") {
    response.status(405).json({ error: "Use POST." });
    return;
  }

  const profile = request.body || {};
  const queries = buildQueries(profile);

  if (!process.env.TAVILY_API_KEY && !process.env.SERPAPI_KEY) {
    response.status(501).json({
      error: "Professor search requires TAVILY_API_KEY or SERPAPI_KEY on the server.",
      searchLinks: queries.map((query) => ({ query, url: makeSearchUrl(query) })),
    });
    return;
  }

  try {
    const batches = await Promise.all(queries.map((query) => searchWeb(query, 6).catch(() => [])));
    const results = batches.flat();
    const deduped = [...new Map(results.map((result) => [result.url, result])).values()].slice(0, 24);
    const enriched = await Promise.all(deduped.slice(0, 12).map(enrichResultWithPageEmail));
    const searchEvidence = [...enriched, ...deduped.slice(12)];
    const focus = [...(profile.analysis?.possibleMajors || []), ...(profile.analysis?.interests || [])].join(", ");
    const location = [profile.city, profile.country].filter(Boolean).join(", ");

    let ranked;
    try {
      ranked = await openaiJson({
        name: "professor_matches",
        schema: PROFESSOR_SCHEMA,
        system:
          "Extract and rank professors, faculty, or principal investigators from web search results. Only include likely individual professors/researchers. Do not fabricate emails; leave email blank if not present. Rank by compatibility with the student's interests and location.",
        user: JSON.stringify({
          studentInterests: focus,
          location,
          resumeText: cleanText(profile.studentText, 6000),
          searchResults: searchEvidence,
        }),
      });
    } catch (error) {
      ranked = {
        notes: "OpenAI ranking unavailable; using search-result ordering.",
        professors: searchEvidence.slice(0, 8).map((result, index) =>
          fallbackProfessorFromResult(result, index, focus, location),
        ),
      };
    }

    response.status(200).json({
      ...ranked,
      professors: ranked.professors.map((professor, index) => ({
        id: `prof-${index}-${professor.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        emailSearchUrl: makeSearchUrl(`${professor.name} ${professor.institution} email`),
        ...professor,
      })),
    });
  } catch (error) {
    response.status(502).json({ error: "Professor search failed.", detail: error.message });
  }
}
