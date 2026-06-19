const form = document.querySelector("#readerForm");
const fileInput = document.querySelector("#fileInput");
const fileStatus = document.querySelector("#fileStatus");
const textInput = document.querySelector("#textInput");
const readerStatus = document.querySelector("#readerStatus");
const wordCount = document.querySelector("#wordCount");
const summaryText = document.querySelector("#summaryText");
const interestList = document.querySelector("#interestList");
const keywordList = document.querySelector("#keywordList");
const evidenceList = document.querySelector("#evidenceList");
const textPreview = document.querySelector("#textPreview");

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
    .split(/(?<=[.!?])\s+/)
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

function summarize(text) {
  const cleanText = normalizeText(text);
  const interests = scoreInterests(cleanText);
  const keywords = getKeywords(cleanText);
  const snippets = getEvidenceSnippets(cleanText, interests);
  const words = countWords(cleanText);
  const topInterests = interests.slice(0, 3);

  wordCount.textContent = `${words} ${words === 1 ? "word" : "words"}`;
  textPreview.textContent = cleanText.slice(0, 4000);

  if (words < 25) {
    summaryText.textContent =
      "There is not enough text yet to make a useful read. Add a longer essay, activity description, resume, or brag sheet.";
  } else if (topInterests.length === 0) {
    summaryText.textContent =
      "The text does not strongly point toward a specific interest area yet. It may need more concrete activities, projects, classes, or motivations.";
  } else {
    const interestPhrase = topInterests.map((interest) => interest.name.toLowerCase()).join(", ");
    const keywordPhrase = keywords
      .slice(0, 4)
      .map((keyword) => keyword.word)
      .join(", ");

    summaryText.textContent = `This student appears most interested in ${interestPhrase}. The strongest signals come from repeated references to ${keywordPhrase || "their activities and experiences"}. A useful next step would be to connect these interests into one clearer theme or direction.`;
  }

  renderChips(interestList, topInterests, (interest) => `${interest.name} (${interest.score})`);
  renderChips(keywordList, keywords.slice(0, 10), (keyword) => `${keyword.word} (${keyword.count})`);
  renderEvidence(snippets);
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

form.addEventListener("submit", (event) => {
  event.preventDefault();
  summarize(textInput.value);
  setStatus("Analysis complete");
});

form.addEventListener("reset", () => {
  window.setTimeout(() => {
    fileStatus.textContent = "No file selected";
    wordCount.textContent = "0 words";
    summaryText.textContent = "Add a file or paste text, then run the reader to generate a summary.";
    interestList.innerHTML = "";
    keywordList.innerHTML = "";
    evidenceList.innerHTML = "";
    textPreview.textContent = "";
    setStatus("Ready");
  }, 0);
});
