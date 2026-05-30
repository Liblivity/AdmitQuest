const form = document.querySelector("#profileForm");
const statsList = document.querySelector("#statsList");
const buildTitle = document.querySelector("#buildTitle");
const readinessBadge = document.querySelector("#readinessBadge");
const verdictText = document.querySelector("#verdictText");
const questList = document.querySelector("#questList");
const questCount = document.querySelector("#questCount");
const introRoast = document.querySelector("#introRoast");
const monsterAvatar = document.querySelector("#monsterAvatar");
const monsterName = document.querySelector("#monsterName");
const monsterPanel = document.querySelector("#monsterPanel");
const verdictLabel = document.querySelector("#verdictLabel");
const monsterRankName = document.querySelector("#monsterRankName");
const monsterRankLine = document.querySelector("#monsterRankLine");
const monsterScore = document.querySelector("#monsterScore");
const monsterRankAvatar = document.querySelector("#monsterRankAvatar");

const monsterRanks = [
  {
    min: 0,
    className: "sprout",
    name: "Application Sprout",
    badge: "Training Arc",
    line: "Tiny, ambitious, and one stiff breeze away from a gap in the activities list.",
  },
  {
    min: 45,
    className: "goblin",
    name: "Admissions Goblin",
    badge: "Needs Loot",
    line: "Functional applicant detected. The goblin remains unimpressed, but awake.",
  },
  {
    min: 62,
    className: "troll",
    name: "Transcript Troll",
    badge: "Competitive",
    line: "Solid stats, decent story, and only a few suspiciously ornamental activities.",
  },
  {
    min: 76,
    className: "drake",
    name: "Honors Drake",
    badge: "Strong Build",
    line: "This application has claws. Now sharpen the narrative before it trips over itself.",
  },
  {
    min: 88,
    className: "phoenix",
    name: "Ivy Phoenix",
    badge: "Final Boss",
    line: "Annoyingly strong. The file is glowing. The committee may need oven mitts.",
  },
];

const majorKeywords = {
  "Computer Science": [
    "computer science",
    "cs",
    "code",
    "programming",
    "software",
    "robotics",
    "app",
    "ai",
    "algorithm",
    "olympiad",
    "usaco",
    "ioi",
    "hackathon",
  ],
  Engineering: ["robotics", "engineering", "build", "cad", "math", "physics", "design"],
  "Pre-Med": ["hospital", "clinic", "biology", "research", "volunteer", "health", "science"],
  Business: ["business", "deca", "startup", "finance", "marketing", "sales", "entrepreneur"],
  Physics: ["physics", "research", "math", "simulation", "astronomy", "engineering", "olympiad"],
  Undecided: ["project", "lead", "research", "volunteer", "club", "job", "community"],
};

const questBank = {
  academic: [
    {
      title: "Win Back Academic Credibility",
      detail: "Pick one hard class or exam goal and build a weekly study sprint around it.",
      reward: "+8 Academic Power",
    },
    {
      title: "Add Rigor Without Exploding",
      detail: "Choose one advanced course that matches your major instead of collecting random difficulty points.",
      reward: "+6 Academic Power",
    },
  ],
  leadership: [
    {
      title: "Stop Being Club Wallpaper",
      detail: "Take ownership of one measurable project inside a club, team, or community group.",
      reward: "+10 Leadership",
    },
    {
      title: "Run a Small Team",
      detail: "Recruit 2-4 people to help execute one event, project, workshop, or campaign.",
      reward: "+12 Leadership",
    },
  ],
  impact: [
    {
      title: "Make the Numbers Real",
      detail: "Track users helped, money raised, students taught, downloads, attendees, or outcomes.",
      reward: "+9 Impact",
    },
    {
      title: "Ship Something Public",
      detail: "Publish a project, guide, event, fundraiser, tool, or resource people can actually use.",
      reward: "+11 Impact",
    },
  ],
  alignment: [
    {
      title: "Build the Major Artifact",
      detail: "Create one project that makes your intended major obvious without needing a translator.",
      reward: "+10 Major Alignment",
    },
    {
      title: "Find a Serious Arena",
      detail: "Enter a competition, research program, internship, or public challenge tied to your major.",
      reward: "+12 Major Alignment",
    },
  ],
  narrative: [
    {
      title: "Connect the Dots",
      detail: "Write a one-sentence theme for your application, then cut activities that do not support it.",
      reward: "+8 Narrative Strength",
    },
    {
      title: "Upgrade the Origin Story",
      detail: "Document why your interests matter and what problem you keep returning to.",
      reward: "+7 Narrative Strength",
    },
  ],
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function countMatches(text, terms) {
  const lowered = text.toLowerCase();
  return terms.reduce((count, term) => count + (lowered.includes(term) ? 1 : 0), 0);
}

function hasAny(text, terms) {
  const lowered = text.toLowerCase();
  return terms.some((term) => lowered.includes(term));
}

function getAwardPower(awardText) {
  const lowered = awardText.toLowerCase();
  const hasInternationalSignal = hasAny(lowered, ["international", "world", "global"]);
  const hasNationalSignal = hasAny(lowered, ["national", "usa", "usaco", "aime", "isef", "regeneron"]);
  const hasEliteCompetition = hasAny(lowered, [
    "olympiad",
    "ioi",
    "imo",
    "icho",
    "ipho",
    "ibo",
    "isef",
    "regeneron",
    "sts",
    "usaco platinum",
  ]);
  const hasTopPlacement = hasAny(lowered, [
    "gold",
    "winner",
    "champion",
    "1st",
    "first place",
    "finalist",
    "medalist",
    "platinum",
  ]);

  if (hasInternationalSignal && hasEliteCompetition && hasTopPlacement) return 42;
  if ((hasInternationalSignal || hasNationalSignal) && hasEliteCompetition) return 32;
  if (hasNationalSignal && hasTopPlacement) return 24;
  if (hasTopPlacement) return 14;
  return 0;
}

function getProfile() {
  return {
    grade: Number(document.querySelector("#grade").value),
    major: document.querySelector("#major").value,
    gpa: Number(document.querySelector("#gpa").value),
    rigor: Number(document.querySelector("#rigor").value),
    activities: document.querySelector("#activities").value,
    awards: document.querySelector("#awards").value,
    targetTier: document.querySelector("#targetTier").value,
  };
}

function scoreProfile(profile) {
  const activityText = `${profile.activities} ${profile.awards}`;
  const awardPower = getAwardPower(profile.awards);
  const activityItems = profile.activities
    .split(/,|\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  const awardItems = profile.awards
    .split(/,|\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  const leadershipMatches = countMatches(activityText, [
    "president",
    "captain",
    "founder",
    "lead",
    "leader",
    "organized",
    "created",
    "started",
  ]);
  const impactMatches = countMatches(activityText, [
    "raised",
    "taught",
    "users",
    "students",
    "published",
    "launched",
    "qualified",
    "winner",
    "finalist",
    "international",
    "national",
    "gold",
    "medal",
    "olympiad",
    "champion",
    "1st",
    "first place",
  ]);
  const alignmentMatches = countMatches(activityText, majorKeywords[profile.major] || []);
  const hasMajorPrestige = awardPower >= 24 && alignmentMatches > 0;

  const academicPower = clamp(profile.gpa * 18 + profile.rigor * 3.6 + awardPower * 0.55);
  const leadership = clamp(18 + leadershipMatches * 15 + Math.min(activityItems.length, 7) * 4);
  const impact = clamp(20 + impactMatches * 10 + awardItems.length * 5 + activityItems.length * 2 + awardPower);
  const majorAlignment = clamp(
    18 + alignmentMatches * 12 + (profile.major === "Undecided" ? 8 : 0) + (hasMajorPrestige ? awardPower * 0.9 : 0),
  );
  const narrativeStrength = clamp(
    28 + alignmentMatches * 7 + leadershipMatches * 5 + impactMatches * 3 + awardPower * 0.55,
  );

  return {
    "Academic Power": academicPower,
    Leadership: leadership,
    Impact: impact,
    "Major Alignment": majorAlignment,
    "Narrative Strength": narrativeStrength,
  };
}

function mergeScores(baseScores, aiScores) {
  if (!aiScores) return baseScores;

  return {
    "Academic Power": clamp(aiScores.academicPower ?? baseScores["Academic Power"]),
    Leadership: clamp(aiScores.leadership ?? baseScores.Leadership),
    Impact: clamp(aiScores.impact ?? baseScores.Impact),
    "Major Alignment": clamp(aiScores.majorAlignment ?? baseScores["Major Alignment"]),
    "Narrative Strength": clamp(aiScores.narrativeStrength ?? baseScores["Narrative Strength"]),
  };
}

async function evaluateWithAi(profile, fallbackScores) {
  try {
    const response = await fetch("/api/evaluate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    });

    if (!response.ok) return { scores: fallbackScores, ai: null };

    const ai = await response.json();
    return {
      scores: mergeScores(fallbackScores, ai.scores),
      ai,
    };
  } catch (error) {
    return { scores: fallbackScores, ai: null };
  }
}

function getLevel(scores) {
  const average = Object.values(scores).reduce((sum, score) => sum + score, 0) / 5;
  return clamp(average / 8 + 1, 1, 15);
}

function getAverageScore(scores) {
  return Object.values(scores).reduce((sum, score) => sum + score, 0) / 5;
}

function getMonsterRank(scores) {
  const average = getAverageScore(scores);
  return monsterRanks
    .filter((rank) => average >= rank.min)
    .sort((a, b) => b.min - a.min)[0];
}

function getReadiness(scores, targetTier) {
  const average = getAverageScore(scores);
  const targetPressure = {
    "Top 20": 82,
    "Top 50": 70,
    "Strong State School": 58,
    "Scholarship Maxing": 74,
  }[targetTier];

  if (average >= targetPressure + 8) return `${targetTier} Ready`;
  if (average >= targetPressure - 7) return `${targetTier} Ready-ish`;
  return `${targetTier} Training Arc`;
}

function getVerdict(profile, scores, aiEvaluation) {
  if (aiEvaluation?.verdict) return aiEvaluation.verdict;

  const weakest = Object.entries(scores).sort((a, b) => a[1] - b[1])[0][0];
  const strongest = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  const monster = getMonsterRank(scores);

  const verdicts = {
    "Academic Power": `${monster.name} verdict: your ${strongest.toLowerCase()} is doing pushups while academic power is looking for a chair. Fix the transcript story before aiming at ${profile.targetTier}.`,
    Leadership: `${monster.name} verdict: you have activities, yes. Leadership? Currently decorative. Pick one arena and become mildly unavoidable.`,
    Impact: `${monster.name} verdict: the vibes exist, but the receipts are missing. Colleges love impact they can count without squinting.`,
    "Major Alignment": `${monster.name} verdict: ${profile.major} applicant detected. Evidence of ${profile.major} obsession is still loading. Build something that makes the major obvious.`,
    "Narrative Strength": `${monster.name} verdict: this is not a build yet. It is a pile. A respectable pile, but still a pile. Find the thread.`,
  };

  return verdicts[weakest];
}

function renderMonster(monster, scores) {
  const average = Math.round(getAverageScore(scores));
  monsterAvatar.className = `monster-avatar ${monster.className}`;
  monsterRankAvatar.className = `monster-avatar ${monster.className} compact`;
  monsterPanel.setAttribute("aria-label", `${monster.name} avatar panel`);
  monsterName.textContent = monster.name;
  introRoast.textContent = monster.line;
  verdictLabel.textContent = `${monster.name} Verdict`;
  monsterRankName.textContent = monster.name;
  monsterRankLine.textContent = monster.line;
  monsterScore.textContent = average;
}

function chooseQuests(scores, aiEvaluation) {
  if (Array.isArray(aiEvaluation?.quests) && aiEvaluation.quests.length > 0) {
    return aiEvaluation.quests.slice(0, 4).map((quest) => ({
      title: quest.title,
      detail: quest.detail,
      reward: quest.reward,
    }));
  }

  const categories = {
    "Academic Power": "academic",
    Leadership: "leadership",
    Impact: "impact",
    "Major Alignment": "alignment",
    "Narrative Strength": "narrative",
  };

  return Object.entries(scores)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 4)
    .map(([stat], index) => {
      const options = questBank[categories[stat]];
      return options[index % options.length];
    });
}

function renderStats(scores) {
  statsList.innerHTML = Object.entries(scores)
    .map(
      ([label, score]) => `
        <div class="stat">
          <div class="stat-row">
            <span>${label}</span>
            <span>${score}/100</span>
          </div>
          <div class="bar" aria-hidden="true">
            <div class="bar-fill" style="--score: ${score}%"></div>
          </div>
        </div>
      `,
    )
    .join("");
}

function renderQuests(quests) {
  questCount.textContent = `${quests.length} quests`;
  questList.innerHTML = quests
    .map(
      (quest, index) => `
        <li class="quest">
          <span class="quest-index">${index + 1}</span>
          <div>
            <h4>${quest.title}</h4>
            <p>${quest.detail}</p>
          </div>
          <span class="reward">${quest.reward}</span>
        </li>
      `,
    )
    .join("");
}

async function generateBuild() {
  const profile = getProfile();
  const fallbackScores = scoreProfile(profile);
  const loadingMonster = getMonsterRank(fallbackScores);

  readinessBadge.textContent = "Evaluating build...";
  monsterRankName.textContent = loadingMonster.name;
  monsterRankLine.textContent = "Checking the applicant file without trusting keyword soup too much.";

  const { scores, ai } = await evaluateWithAi(profile, fallbackScores);
  const level = getLevel(scores);
  const monster = getMonsterRank(scores);

  buildTitle.textContent = `${profile.major} Applicant Lv. ${level}`;
  readinessBadge.textContent = `${monster.badge}: ${getReadiness(scores, profile.targetTier)}`;
  verdictText.textContent = getVerdict(profile, scores, ai);
  renderMonster(monster, scores);
  renderStats(scores);
  renderQuests(chooseQuests(scores, ai));
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  generateBuild();
});

form.addEventListener("reset", () => {
  window.setTimeout(generateBuild, 0);
});

generateBuild();
