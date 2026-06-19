const form = document.querySelector("#readerForm");
const analyzeButton = document.querySelector("#analyzeButton");
const editInputButton = document.querySelector("#editInputButton");
const editInputTopButton = document.querySelector("#editInputTopButton");
const fileInput = document.querySelector("#fileInput");
const fileStatus = document.querySelector("#fileStatus");
const textInput = document.querySelector("#textInput");
const readerStatus = document.querySelector("#readerStatus");
const wordCount = document.querySelector("#wordCount");
const summaryText = document.querySelector("#summaryText");
const majorList = document.querySelector("#majorList");
const interestList = document.querySelector("#interestList");
const keywordList = document.querySelector("#keywordList");
const strengthList = document.querySelector("#strengthList");
const weaknessList = document.querySelector("#weaknessList");
const evidenceList = document.querySelector("#evidenceList");
const textPreview = document.querySelector("#textPreview");
const countrySelect = document.querySelector("#countrySelect");
const cityInput = document.querySelector("#cityInput");
const radiusSelect = document.querySelector("#radiusSelect");
const findLabsButton = document.querySelector("#findLabsButton");
const labStatus = document.querySelector("#labStatus");
const labList = document.querySelector("#labList");

let latestAnalysis = null;

function showAnalysisMode() {
  document.body.classList.add("analysis-mode");
}

function showInputMode() {
  document.body.classList.remove("analysis-mode");
  textInput.focus();
}

const interestCategories = [
  {
    name: "Computer Science and AI",
    terms: ["code", "coding", "programming", "software", "computer science", "ai", "machine learning", "algorithm", "robotics", "app", "website", "data"],
  },
  {
    name: "Engineering and Building",
    terms: ["engineering", "build", "designed", "prototype", "robot", "cad", "mechanical", "electrical", "circuit", "device", "manufacturing"],
  },
  {
    name: "Medicine and Health",
    terms: ["medicine", "medical", "health", "doctor", "hospital", "clinic", "patient", "biology", "neuroscience", "public health", "care"],
  },
  {
    name: "Business and Entrepreneurship",
    terms: ["business", "startup", "entrepreneur", "marketing", "finance", "sales", "customer", "product", "revenue", "nonprofit", "fundraiser"],
  },
  {
    name: "Research and Discovery",
    terms: ["research", "study", "experiment", "lab", "paper", "published", "analysis", "investigate", "hypothesis", "survey", "data"],
  },
  {
    name: "Community Service and Advocacy",
    terms: ["volunteer", "community", "service", "advocacy", "helped", "mentored", "tutored", "donated", "equity", "access", "outreach"],
  },
  {
    name: "Leadership and Organization",
    terms: ["led", "leader", "president", "captain", "founder", "organized", "managed", "team", "club", "initiative", "event"],
  },
  {
    name: "Writing and Humanities",
    terms: ["writing", "essay", "journalism", "history", "literature", "language", "philosophy", "debate", "policy", "story", "culture"],
  },
  {
    name: "Art, Design, and Media",
    terms: ["art", "design", "music", "film", "photography", "media", "creative", "portfolio", "animation", "theater", "visual"],
  },
  {
    name: "Math and Quantitative Thinking",
    terms: ["math", "mathematics", "calculus", "statistics", "quantitative", "proof", "competition", "olympiad", "modeling", "economics"],
  },
];

const stopWords = new Set([
  "about",
  "after",
  "again",
  "also",
  "because",
  "before",
  "being",
  "could",
  "every",
  "first",
  "from",
  "have",
  "into",
  "just",
  "like",
  "more",
  "most",
  "other",
  "over",
  "their",
  "there",
  "these",
  "they",
  "this",
  "through",
  "under",
  "using",
  "where",
  "which",
  "while",
  "with",
  "would",
  "student",
  "school",
  "college",
  "application",
]);

const labInterestKeywords = {
  "Computer Science": ["computer", "computing", "software", "ai", "artificial intelligence", "data", "robotics", "informatics"],
  "Computer Science and AI": ["computer", "computing", "software", "ai", "artificial intelligence", "data", "robotics", "informatics"],
  "Mechanical Engineering": ["engineering", "mechanical", "robotics", "manufacturing", "design"],
  Engineering: ["engineering", "robotics", "mechanical", "technology", "manufacturing", "design"],
  "Engineering and Building": ["engineering", "robotics", "mechanical", "technology", "manufacturing", "design"],
  "Data Science / Analytics": ["data", "analytics", "statistics", "informatics", "computing"],
  "Medicine and Health": ["medical", "medicine", "health", "biology", "biomedical", "hospital"],
  "Research and Discovery": ["research", "institute", "laboratory", "lab", "science"],
  "Math and Quantitative Thinking": ["math", "mathematics", "statistics", "quantitative", "data"],
};

const overpassEndpoints = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];

if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

function setStatus(message) {
  readerStatus.textContent = message;
}

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function countWords(text) {
  return normalizeText(text).split(/\s+/).filter(Boolean).length;
}

function termCount(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\b${escaped}\\b`, "gi");
  return (text.match(pattern) || []).length;
}

function scoreInterests(text) {
  const lowered = text.toLowerCase();
  return interestCategories
    .map((category) => {
      const score = category.terms.reduce((total, term) => total + termCount(lowered, term), 0);
      return { ...category, score };
    })
    .filter((category) => category.score > 0)
    .sort((a, b) => b.score - a.score);
}

function getKeywords(text) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));

  const counts = new Map();
  words.forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([word, count]) => ({ word, count }));
}

function getEvidenceSnippets(text, interests) {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 35);

  const selected = [];
  interests.slice(0, 4).forEach((interest) => {
    const match = sentences.find((sentence) =>
      interest.terms.some((term) => sentence.toLowerCase().includes(term)),
    );

    if (match && !selected.includes(match)) {
      selected.push(match.length > 220 ? `${match.slice(0, 217)}...` : match);
    }
  });

  return selected.slice(0, 4);
}

function includesAny(text, terms) {
  const lowered = text.toLowerCase();
  return terms.some((term) => lowered.includes(term));
}

function getPossibleMajors(text, interests) {
  const majors = [];
  const lowered = text.toLowerCase();

  if (includesAny(lowered, ["python", "java", "coding", "discord", "github", "downloads", "computer science", "ap computer science"])) {
    majors.push("Computer Science");
  }

  if (includesAny(lowered, ["robotics", "mechanical", "cad", "fusion 360", "engineering", "robot", "physics"])) {
    majors.push("Mechanical Engineering");
    majors.push("Engineering");
  }

  if (includesAny(lowered, ["data entry", "spreadsheet", "excel", "analysis", "statistics"])) {
    majors.push("Data Science / Analytics");
  }

  if (includesAny(lowered, ["newspaper", "staff writer", "articles", "journalism"])) {
    majors.push("Journalism / Communications");
  }

  if (majors.length === 0 && interests[0]) {
    majors.push(interests[0].name);
  }

  return [...new Set(majors)].slice(0, 4);
}

function getStrengths(text) {
  const lowered = text.toLowerCase();
  const strengths = [];

  if (includesAny(lowered, ["ap calculus", "ap physics", "ap computer science", "honors chemistry", "3.92", "4.35"])) {
    strengths.push("Strong STEM academic base with rigorous coursework and high grades.");
  }

  if (includesAny(lowered, ["mechanical team lead", "team lead", "captain", "founder", "president"])) {
    strengths.push("Emerging leadership, especially through robotics or team-based activities.");
  }

  if (includesAny(lowered, ["github", "downloads", "built", "created", "project", "application", "bot"])) {
    strengths.push("Concrete project-building signal, with software work that exists beyond class assignments.");
  }

  if (includesAny(lowered, ["tutored", "volunteer", "80 volunteer hours", "recurring students"])) {
    strengths.push("Service and teaching experience with measurable commitment.");
  }

  if (includesAny(lowered, ["published", "articles", "newspaper", "writer"])) {
    strengths.push("Communication ability through published writing or journalism.");
  }

  if (strengths.length === 0) {
    strengths.push("The profile has enough detail to begin identifying interests and activity patterns.");
  }

  return strengths.slice(0, 5);
}

function getWeaknesses(text) {
  const lowered = text.toLowerCase();
  const weaknesses = [];

  if (includesAny(lowered, ["not taken yet", "sat: not", "act: not"])) {
    weaknesses.push("Testing is not established yet, so academic testing strength is still unknown.");
  }

  if (!includesAny(lowered, ["research", "published research", "lab", "paper", "isef"])) {
    weaknesses.push("No clear research or advanced academic distinction yet, which matters for highly selective STEM paths.");
  }

  if (!includesAny(lowered, ["winner", "1st", "first place", "national", "international", "state champion"])) {
    weaknesses.push("Awards appear mostly school or regional level; stronger external recognition would help.");
  }

  if (includesAny(lowered, ["general member", "member (9th-10th)", "participated"])) {
    weaknesses.push("Some activities read as participation rather than ownership or measurable impact.");
  }

  if (includesAny(lowered, ["looking for internship", "interested in developing", "candidate"])) {
    weaknesses.push("Several strongest opportunities are still future plans rather than completed achievements.");
  }

  return weaknesses.slice(0, 5);
}

function renderChips(container, items, formatter) {
  container.innerHTML = "";

  if (items.length === 0) {
    container.innerHTML = '<span class="empty-note">No clear signals yet</span>';
    return;
  }

  items.forEach((item) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = formatter(item);
    container.appendChild(chip);
  });
}

function renderEvidence(snippets) {
  evidenceList.innerHTML = "";

  if (snippets.length === 0) {
    evidenceList.innerHTML = '<li>No strong evidence snippets found yet. Add more detailed text.</li>';
    return;
  }

  snippets.forEach((snippet) => {
    const item = document.createElement("li");
    item.textContent = snippet;
    evidenceList.appendChild(item);
  });
}

function renderList(container, items) {
  container.innerHTML = "";

  if (!items || items.length === 0) {
    container.innerHTML = '<li>No clear signal yet</li>';
    return;
  }

  items.forEach((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    container.appendChild(item);
  });
}

function buildLocalAnalysis(text) {
  const cleanText = normalizeText(text);
  const interests = scoreInterests(cleanText);
  const keywords = getKeywords(cleanText);
  const snippets = getEvidenceSnippets(cleanText, interests);
  const words = countWords(cleanText);
  const topInterests = interests.slice(0, 3);
  const possibleMajors = getPossibleMajors(cleanText, interests);
  const strengths = getStrengths(cleanText);
  const weaknesses = getWeaknesses(cleanText);

  let summary =
    "There is not enough text yet to make a useful read. Add a longer essay, activity description, resume, or brag sheet.";

  if (words >= 25 && topInterests.length === 0) {
    summary =
      "The text does not strongly point toward a specific interest area yet. It may need more concrete activities, projects, classes, or motivations.";
  } else if (words >= 25) {
    const interestPhrase = topInterests.map((interest) => interest.name.toLowerCase()).join(", ");
    const keywordPhrase = keywords
      .slice(0, 4)
      .map((keyword) => keyword.word)
      .join(", ");

    summary = `This student appears most interested in ${interestPhrase}. The likely academic direction is ${possibleMajors.join(", ") || "still undecided"}. The strongest signals come from ${keywordPhrase || "their activities and experiences"}. The profile is strongest where projects, robotics, academics, and service overlap, but it still needs clearer high-level distinction and completed leadership impact.`;
  }

  return {
    summary,
    possibleMajors,
    interests: topInterests.map((interest) => interest.name),
    keywords: keywords.slice(0, 10).map((keyword) => `${keyword.word} (${keyword.count})`),
    strengths,
    weaknesses,
    evidence: snippets,
    words,
    extractedText: cleanText,
  };
}

async function summarizeWithApi(text) {
  const response = await fetch("/api/summarize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error("API summary unavailable");
  }

  return response.json();
}

function renderAnalysis(analysis) {
  latestAnalysis = analysis;
  showAnalysisMode();
  wordCount.textContent = `${analysis.words} ${analysis.words === 1 ? "word" : "words"}`;
  textPreview.textContent = (analysis.extractedText || textInput.value).slice(0, 4000);
  summaryText.textContent = analysis.summary;

  renderChips(majorList, analysis.possibleMajors || [], (major) => major);
  renderChips(interestList, analysis.interests || [], (interest) => interest);
  renderChips(keywordList, analysis.keywords || [], (keyword) => keyword);
  renderList(strengthList, analysis.strengths || []);
  renderList(weaknessList, analysis.weaknesses || []);
  renderEvidence(analysis.evidence || []);
}

function getLabKeywords() {
  const terms = new Set(["research", "lab", "laboratory", "institute", "university"]);
  const sources = [...(latestAnalysis?.possibleMajors || []), ...(latestAnalysis?.interests || [])];

  sources.forEach((source) => {
    (labInterestKeywords[source] || [source]).forEach((term) => terms.add(term.toLowerCase()));
  });

  return [...terms].slice(0, 12);
}

function getSearchInterestPhrase() {
  const source = latestAnalysis?.possibleMajors?.[0] || latestAnalysis?.interests?.[0] || "student research";
  return source.replace(/\s*\/\s*/g, " ");
}

function setLabStatus(message) {
  labStatus.textContent = message;
}

function makeSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function makeMapsUrl(lat, lon, name) {
  if (lat && lon) return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`;
  return makeSearchUrl(name);
}

async function geocodeLocation(city, country) {
  const query = country === "Other" ? city : `${city}, ${country}`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) throw new Error("Could not geocode location.");

  const places = await response.json();
  if (!places.length) throw new Error("Location not found.");

  return {
    label: places[0].display_name,
    lat: Number(places[0].lat),
    lon: Number(places[0].lon),
  };
}

async function fetchNearbyResearchPlaces(lat, lon, radius) {
  const query = `
    [out:json][timeout:25];
    (
      nwr(around:${radius},${lat},${lon})["amenity"="university"];
      nwr(around:${radius},${lat},${lon})["amenity"="college"];
      nwr(around:${radius},${lat},${lon})["office"="research"];
      nwr(around:${radius},${lat},${lon})["healthcare"="laboratory"];
      nwr(around:${radius},${lat},${lon})["amenity"="laboratory"];
    );
    out center tags 40;
  `;

  let response = null;

  for (const endpoint of overpassEndpoints) {
    const url = `${endpoint}?data=${encodeURIComponent(query)}`;
    try {
      response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });
      if (response.ok) break;
    } catch (error) {
      response = null;
    }
  }

  if (!response?.ok) throw new Error("Map search failed.");

  const data = await response.json();
  return data.elements || [];
}

function elementToLab(element, locationLabel) {
  const tags = element.tags || {};
  const name = tags.name || tags["official_name"] || tags["operator"] || "Unnamed research place";
  const lat = element.lat || element.center?.lat;
  const lon = element.lon || element.center?.lon;
  const type =
    tags.amenity ||
    tags.office ||
    tags.healthcare ||
    tags.tourism ||
    "research-related place";

  return {
    id: `${element.type}-${element.id}`,
    name,
    type: String(type).replace(/_/g, " "),
    website: normalizeUrl(tags.website || tags["contact:website"] || ""),
    lat,
    lon,
    locationLabel,
    rawText: `${name} ${type} ${tags.operator || ""} ${tags.description || ""}`.toLowerCase(),
  };
}

function rankLabs(labs, keywords) {
  const seen = new Set();

  return labs
    .filter((lab) => {
      const key = lab.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return lab.name !== "Unnamed research place";
    })
    .map((lab) => {
      const score = keywords.reduce((total, keyword) => total + (lab.rawText.includes(keyword) ? 2 : 0), 0);
      const researchScore = /research|lab|laboratory|institute|university|college/.test(lab.rawText) ? 3 : 0;
      return { ...lab, score: score + researchScore };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 12);
}

function renderLabs(labs, city, country) {
  labList.innerHTML = "";
  const interestPhrase = getSearchInterestPhrase();

  if (labs.length === 0) {
    const card = document.createElement("article");
    card.className = "lab-card";
    card.innerHTML = `
      <h4>No mapped labs found yet</h4>
      <p class="lab-note">Public map data can be sparse. Use these targeted searches instead.</p>
      <div class="lab-actions">
        <a href="${makeSearchUrl(`${interestPhrase} research lab ${city} ${country}`)}" target="_blank" rel="noreferrer">Search labs</a>
        <a href="${makeSearchUrl(`${interestPhrase} professor research ${city} ${country}`)}" target="_blank" rel="noreferrer">Search professors</a>
        <a href="${makeSearchUrl(`${interestPhrase} internship ${city} ${country} high school`)}" target="_blank" rel="noreferrer">Search internships</a>
      </div>
    `;
    labList.appendChild(card);
    return;
  }

  labs.forEach((lab) => {
    const card = document.createElement("article");
    card.className = "lab-card";
    const searchQuery = `${lab.name} ${interestPhrase} research opportunities`;
    const safeName = escapeHtml(lab.name);
    const safeType = escapeHtml(lab.type);
    card.innerHTML = `
      <h4>${safeName}</h4>
      <div class="lab-meta">
        <span>${safeType}</span>
        <span>${lab.score > 3 ? "Interest match" : "Nearby research place"}</span>
      </div>
      <p class="lab-note">Use this as a lead: check faculty pages, lab websites, summer programs, and outreach/contact pages.</p>
      <div class="lab-actions">
        ${lab.website ? `<a href="${lab.website}" target="_blank" rel="noreferrer">Website</a>` : ""}
        <a href="${makeMapsUrl(lab.lat, lab.lon, lab.name)}" target="_blank" rel="noreferrer">Map</a>
        <a href="${makeSearchUrl(searchQuery)}" target="_blank" rel="noreferrer">Research match</a>
      </div>
    `;
    labList.appendChild(card);
  });
}

async function findResearchLabs() {
  const city = cityInput.value.trim();
  const country = countrySelect.value;
  const radius = Number(radiusSelect.value);

  if (!city) {
    setLabStatus("Add a city");
    return;
  }

  findLabsButton.disabled = true;
  setLabStatus("Searching...");
  labList.innerHTML = "";

  try {
    const place = await geocodeLocation(city, country);
    const elements = await fetchNearbyResearchPlaces(place.lat, place.lon, radius);
    const labs = elements.map((element) => elementToLab(element, place.label));
    const ranked = rankLabs(labs, getLabKeywords());
    renderLabs(ranked, city, country);
    setLabStatus(`${ranked.length} leads`);
  } catch (error) {
    renderLabs([], city, country);
    setLabStatus("Search fallback");
  } finally {
    findLabsButton.disabled = false;
  }
}

async function analyzeCurrentText() {
  const text = textInput.value;
  const words = countWords(text);

  if (words === 0) {
    setStatus("Add text first");
    return;
  }

  analyzeButton.disabled = true;
  setStatus("Analyzing...");

  try {
    const localAnalysis = buildLocalAnalysis(text);
    renderAnalysis(localAnalysis);
    setStatus("Local analysis complete");

    const apiAnalysis = await summarizeWithApi(text);
    renderAnalysis({ ...apiAnalysis, words, extractedText: normalizeText(text) });
    setStatus("AI analysis complete");
  } catch (error) {
    setStatus("Local analysis complete");
  } finally {
    analyzeButton.disabled = false;
  }
}

async function readTextFile(file) {
  return file.text();
}

async function readPdf(file) {
  if (!window.pdfjsLib) {
    throw new Error("PDF reader did not load. Check your internet connection and try again.");
  }

  const buffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }

  return pages.join("\n\n");
}

async function readDocx(file) {
  if (!window.mammoth) {
    throw new Error("Word reader did not load. Check your internet connection and try again.");
  }

  const buffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

async function readFile(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) return readPdf(file);
  if (name.endsWith(".docx")) return readDocx(file);
  if (name.endsWith(".doc")) {
    throw new Error("Old .doc files are not supported yet. Please export as .docx or paste the text.");
  }

  return readTextFile(file);
}

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];

  if (!file) {
    fileStatus.textContent = "No file selected";
    return;
  }

  fileStatus.textContent = file.name;
  setStatus("Reading file...");

  try {
    const text = await readFile(file);
    textInput.value = text.trim();
    setStatus("File loaded");
  } catch (error) {
    setStatus(error.message);
  }
});

window.analyzeCurrentText = analyzeCurrentText;

analyzeButton.addEventListener("click", analyzeCurrentText);
editInputButton.addEventListener("click", showInputMode);
editInputTopButton.addEventListener("click", showInputMode);
findLabsButton.addEventListener("click", findResearchLabs);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  analyzeCurrentText();
});

form.addEventListener("reset", () => {
  window.setTimeout(() => {
    fileStatus.textContent = "No file selected";
    wordCount.textContent = "0 words";
    summaryText.textContent = "Add a file or paste text, then run the reader to generate a summary.";
    majorList.innerHTML = "";
    interestList.innerHTML = "";
    keywordList.innerHTML = "";
    strengthList.innerHTML = "";
    weaknessList.innerHTML = "";
    evidenceList.innerHTML = "";
    labList.innerHTML = "";
    textPreview.textContent = "";
    latestAnalysis = null;
    showInputMode();
    setStatus("Ready");
    setLabStatus("Not searched");
  }, 0);
});
