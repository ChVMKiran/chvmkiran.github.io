import type { Project, SectionId } from "@/data/portfolio";
import {
  achievements,
  certifications,
  education,
  experience,
  profile,
  projects,
  skillGroups,
  socials,
  stats,
} from "@/data/portfolio";

/**
 * GuideBot's answer engine (spec §29).
 *
 * Purely rule-based: no API key, no network request, no model call. Every reply
 * is assembled from `@/data/portfolio`, which stays the single source of truth,
 * so the bot cannot invent an employer, a metric, or a URL.
 *
 * Matching is anchored on word boundaries on purpose. A naive `includes()`
 * check misfires badly here — "his" contains "hi" and "this" too — so a
 * question about, say, education would be answered with the greeting.
 */

export type ChatTurn = { role: "user" | "assistant"; content: string };

/** Sections that exist in the page, including two that the nav omits. */
export type GuideSection = SectionId | "certifications" | "stats";

export type ChatResult =
  | { ok: true; reply: string; section?: GuideSection }
  | { ok: false; error: string };

const MAX_MESSAGE_CHARS = 500;

/** "tell me more" without a topic re-uses the previous user question. */
const FOLLOW_UP =
  /^(more|tell me more|more details?|details?|elaborate|expand|go on|continue|and|why|how so)\??$/i;

/** Extra spellings/aliases for projects, matched as whole phrases. */
const PROJECT_ALIASES: Record<string, readonly string[]> = {
  "farmo-phile": ["farmo", "farmo phile", "farmophile"],
  "shadow-note": ["shadow note", "shadownote"],
  "level-up-dev": ["level up dev", "level up", "levelup"],
  "movie-review-sentiment-analyzer": ["movie review", "sentiment analyzer", "sentiment"],
  finmate: ["finmate", "fin mate"],
  "to-do-list": ["to do list", "todo", "to do"],
  "weather-now": ["weather now", "weather app"],
  calculator: ["calculator"],
  "tic-tac-toe": ["tic tac toe", "tictactoe", "tic tac"],
};

/**
 * Lowercase, accent-free, punctuation-free copy of the input. Used for every
 * match so "Résumé", "resume", and "CV" behave the same.
 */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Matches at a word start, so "educ" catches education and educational. */
function hasStem(q: string, ...terms: string[]): boolean {
  return terms.some((term) => new RegExp(`\\b${escapeRegExp(term)}`).test(q));
}

/**
 * Matches a whole word or phrase. The boundaries are spelled out instead of
 * using `\b` so terms that end in a symbol — "C++" — still match.
 */
function hasWord(q: string, ...terms: string[]): boolean {
  return terms.some((term) =>
    new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(term)}(?![a-z0-9])`).test(q),
  );
}

function matchesPhrase(q: string, phrase: string): boolean {
  const normalized = normalize(phrase);
  return normalized.length > 0 && hasWord(q, normalized);
}

/* ------------------------------------------------------------------ replies */

function educationReply(): string {
  return `${education.degree} at ${education.institution}, ${education.dates}, with a CGPA of ${education.cgpa}. Focus areas: ${education.focus.join(", ")}. The Education section has the full entry.`;
}

function experienceReply(): string {
  return `Two roles are listed. ${experience
    .map((entry) => `${entry.role} at ${entry.org} (${entry.period}) — ${entry.description}`)
    .join(" ")} Both are in the Experience section.`;
}

function skillsReply(): string {
  return `Kiran works across ${skillGroups.length} areas: ${skillGroups
    .map((group) => `${group.name} (${group.skills.join(", ")})`)
    .join("; ")}. The Skills section breaks each one down.`;
}

function projectsReply(): string {
  const featured = projects.filter((project) => project.featured);
  const lead = featured[0] ?? projects[0];
  return `${projects.length} projects are listed, ${featured.length} of them featured: ${featured
    .map((project) => project.title)
    .join(", ")}. The standout is ${lead.title}: ${lead.description} The Projects section has every one.`;
}

function allProjectsReply(): string {
  return `The full set: ${projects.map((project) => project.title).join(", ")}. Each is expanded in the Projects section.`;
}

function projectReply(project: Project): string {
  const parts = [`${project.title} — ${project.description}`, `Tech: ${project.tech.join(", ")}.`];
  if (project.metrics.length > 0) {
    parts.push(`Verified results: ${project.metrics.join(", ")}.`);
  }
  if (project.note) parts.push(project.note);
  parts.push(
    project.repo || project.demo
      ? "The Projects section links to it."
      : "No public repository or demo link is listed for it.",
  );
  return parts.join(" ");
}

function achievementsReply(): string {
  return `Competitive programming results: ${achievements
    .map((entry) => `${entry.platform} — ${entry.headline}, ${entry.detail}`)
    .join("; ")}. They are all in the Achievements section.`;
}

function certificationsReply(): string {
  return `${certifications.length} certifications are listed: ${certifications
    .map((entry) => `${entry.name} (${entry.issuer})`)
    .join("; ")}. They are in the Certifications section.`;
}

function contactReply(): string {
  return `Email ${profile.email} or call ${profile.phone}. The Contact section also has a message form, and LinkedIn and GitHub are linked there.`;
}

function resumeReply(): string {
  return profile.resumeUrl
    ? `The resume is a PDF at ${profile.resumeUrl}. The Resume button in the navbar and the Download Resume button in the hero both point to it.`
    : "No resume file is linked in this build.";
}

function linksReply(): string {
  return `Profiles: ${socials.map((entry) => `${entry.label} — ${entry.href}`).join("; ")}.`;
}

function locationReply(): string {
  return `Based in ${profile.location}.`;
}

function currentReply(): string {
  const current = experience[0];
  return `Currently ${current.role} at ${current.org} (${current.period}). Also in the final stretch of a ${education.degree} at ${education.institution}.`;
}

function aboutReply(): string {
  return `${profile.summary} Based in ${profile.location}. The About section goes into more detail.`;
}

function statsReply(): string {
  return `Quick stats: ${stats
    .map((stat) => `${stat.value}${stat.suffix} ${stat.label.toLowerCase()} — ${stat.context}`)
    .join("; ")}.`;
}

function nameReply(): string {
  return `This is the portfolio of ${profile.name} — ${profile.positioning}, based in ${profile.location}.`;
}

const GREETING =
  "Hello. I answer from this portfolio only — try education, experience, projects, skills, achievements, certifications, or contact. What would you like to know?";

const THANKS = "You're welcome. Anything else — projects, skills, experience, or contact?";

const HELP =
  'Ask about Kiran\'s education, experience, projects, skills, achievements, certifications, links, or contact details. For example: "What is his education?" or "What has he built?"';

const FALLBACK =
  "I can only answer from this portfolio. Try asking about Kiran's education, experience, projects, skills, achievements, certifications, or contact details.";

/* ---------------------------------------------------------- skill lookup */

type SkillHit = { skill: string; group: string };

/**
 * Finds skills the visitor named outright ("does he know Python?"). Tokens
 * shorter than three characters are ignored so "C", "OS", and "ML" cannot
 * match arbitrary words; those are still reachable through the skills intent.
 */
function findSkills(q: string): SkillHit[] {
  const hits: SkillHit[] = [];

  for (const group of skillGroups) {
    for (const skill of group.skills) {
      const tokens = normalize(skill)
        .split(" ")
        .filter((token) => token.length >= 3);

      if (tokens.some((token) => hasWord(q, token))) {
        hits.push({ skill, group: group.name });
      }
    }
  }

  return hits.slice(0, 3);
}

function skillReply(hits: SkillHit[]): string {
  const names = hits.map((hit) => hit.skill);
  const groups = [...new Set(hits.map((hit) => hit.group))];
  const keys = new Set(names.map((name) => normalize(name).split(" ")[0]));

  const usedIn = projects
    .filter((project) =>
      project.tech.some((tech) => keys.has(normalize(tech).split(" ")[0])),
    )
    .map((project) => project.title);

  const list =
    names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  const groupPhrase =
    groups.length === 1 ? `the ${groups[0]} group` : `the ${groups.join(" and ")} groups`;
  const verb = names.length === 1 ? "is" : "are";
  const usage = usedIn.length
    ? `${names.length === 1 ? "It's" : "They're"} used in ${usedIn.slice(0, 3).join(", ")}.`
    : `${names.length === 1 ? "It isn't" : "They aren't"} listed against a specific project.`;

  return `${list} ${verb} in ${groupPhrase} of the Skills section. ${usage}`;
}

/* --------------------------------------------------------------- matching */

type Answer = { reply: string; section?: GuideSection };

function answerFor(question: string): Answer {
  const q = normalize(question);

  const candidates: (Answer & { score: number })[] = [];
  const offer = (score: number, reply: string, section?: GuideSection) => {
    if (score > 0) candidates.push({ score, reply, section });
  };

  // Questions the portfolio cannot answer. Refuse plainly rather than leaving
  // a gap for a guess.
  if (hasWord(q, "salary", "compensation", "ctc", "remuneration", "pay", "package")) {
    return {
      reply: `I don't have that information — this bot only covers what's published in the portfolio. For anything else, email ${profile.email}.`,
      section: "contact",
    };
  }

  // A named project outranks every generic answer.
  const namedProject = projects.find((project) =>
    (PROJECT_ALIASES[project.slug] ?? []).some((alias) => matchesPhrase(q, alias)),
  );
  if (namedProject) return { reply: projectReply(namedProject), section: "projects" };

  // Certification intent is scored separately from the skill lookup, so
  // "AWS certification" belongs with qualifications while "does he know AWS?"
  // belongs with skills.
  const certStem = hasStem(q, "certif", "credential");
  const certName = certifications.some((entry) => matchesPhrase(q, entry.name));
  const certIntent = certStem || certName || hasWord(q, "aws", "oracle");

  const skillHits = findSkills(q);

  if (hasWord(q, "resume", "cv", "download")) offer(10, resumeReply());

  offer(
    hasStem(
      q,
      "educ",
      "graduat",
      "colleg",
      "univers",
      "degree",
      "cgpa",
      "gpa",
      "academic",
      "qualif",
      "btech",
      "b tech",
      "branch",
      "school",
      "major",
      "specializ",
      "stud",
      "computer science",
    )
      ? 9
      : 0,
    educationReply(),
    "education",
  );

  // Links are matched before the skill lookup because "GitHub" is also a tool
  // in the Skills section, but a visitor asking for "his GitHub" wants the URL.
  if (
    hasWord(q, "github", "linkedin", "link", "links", "social", "socials", "website", "url", "urls")
  ) {
    offer(9, linksReply(), "contact");
  }

  // A named skill answers "does he know X?" better than a category list.
  if (skillHits.length > 0) offer(9, skillReply(skillHits), "skills");

  const projectIntent =
    hasStem(q, "project") ||
    hasWord(
      q,
      "built",
      "build",
      "builds",
      "building",
      "made",
      "make",
      "making",
      "create",
      "created",
      "creating",
      "develop",
      "developed",
      "developing",
      "apps",
      "applications",
      "application",
      "his work",
      "your work",
      "worked on",
      "working on",
      "work on",
    );
  if (projectIntent) {
    offer(8, hasWord(q, "all", "every", "list") ? allProjectsReply() : projectsReply(), "projects");
  }

  const experienceIntent =
    hasStem(q, "intern", "experienc", "employer", "profession", "career") ||
    hasWord(
      q,
      "job",
      "jobs",
      "company",
      "companies",
      "work",
      "works",
      "worked",
      "working",
      "role",
    );
  if (experienceIntent) offer(8, experienceReply(), "experience");

  const skillsIntent =
    hasStem(q, "skill", "technolog", "framework", "proficien", "expertise") ||
    hasWord(
      q,
      "tech",
      "stack",
      "tool",
      "tools",
      "language",
      "languages",
      "know",
      "knows",
      "knowledge",
      "ml",
      "ai",
    );
  if (skillsIntent) offer(8, skillsReply(), "skills");

  const achievementsIntent =
    hasStem(q, "achiev") ||
    hasWord(
      q,
      "leetcode",
      "geeksforgeeks",
      "gfg",
      "codeforces",
      "codechef",
      "rating",
      "ratings",
      "rank",
      "ranked",
      "knight",
      "contest",
      "contests",
      "award",
      "awards",
      "competitive",
      "solved",
      "problems",
    );
  if (achievementsIntent) offer(8, achievementsReply(), "achievements");

  if (certIntent) {
    offer(certName ? 11 : certStem ? 10 : 8, certificationsReply(), "certifications");
  }

  const contactIntent =
    hasStem(q, "contact") ||
    hasWord(
      q,
      "email",
      "mail",
      "reach",
      "hire",
      "hiring",
      "phone",
      "call",
      "connect",
      "available",
      "message",
      "get in touch",
      "open to work",
      "reach out",
    );
  if (contactIntent) offer(9, contactReply(), "contact");

  if (
    hasStem(q, "locat") ||
    hasWord(q, "where", "based", "live", "lives", "living", "city", "address", "from")
  ) {
    offer(6, locationReply(), "about");
  }

  if (hasWord(q, "currently", "current", "now", "doing")) {
    offer(7, currentReply(), "experience");
  }

  if (
    hasWord(
      q,
      "about",
      "background",
      "summary",
      "bio",
      "introduce",
      "introduction",
      "describe",
      "who",
      "profile",
      "himself",
      "yourself",
      "does he do",
      "tell me about",
    )
  ) {
    offer(5, aboutReply(), "about");
  }

  if (hasWord(q, "stats", "statistics", "numbers", "metrics")) {
    offer(7, statsReply(), "stats");
  }
  if (hasWord(q, "name")) offer(8, nameReply(), "about");
  if (hasWord(q, "help", "what can you do") || hasStem(q, "guid", "navigat")) {
    offer(7, HELP);
  }
  if (hasWord(q, "hi", "hello", "hey", "greetings", "yo")) offer(5, GREETING);
  if (hasStem(q, "thank")) offer(6, THANKS);

  let best: (Answer & { score: number }) | undefined;
  for (const candidate of candidates) {
    if (!best || candidate.score > best.score) best = candidate;
  }

  return best ? { reply: best.reply, section: best.section } : { reply: FALLBACK };
}

/* ------------------------------------------------------------- entrypoint */

export function answerQuestion(message: string, history: ChatTurn[] = []): ChatResult {
  const question = typeof message === "string" ? message.trim().slice(0, MAX_MESSAGE_CHARS) : "";
  if (question.length === 0) {
    return { ok: false, error: "Ask me something about the portfolio." };
  }

  let resolved = question;
  if (FOLLOW_UP.test(question)) {
    const prior = [...history]
      .reverse()
      .find((turn) => turn.role === "user" && turn.content.trim().length > 0);
    if (prior) resolved = prior.content;
  }

  const answer = answerFor(resolved);
  return { ok: true, reply: answer.reply, section: answer.section };
}
