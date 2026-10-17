/**
 * Single source of truth for every factual claim on the site.
 *
 * Rules this file encodes:
 *  - No invented URLs. A project only gets a link when one was actually supplied.
 *  - No invented metrics, employers, testimonials, or clients.
 *  - Components read from here; they never hardcode facts of their own.
 */

import type { StaticImageData } from "next/image";

import profilePhoto from "@/assets/profile-photo.jpg";

export type Project = {
  /** Stable slug, used for keys and anchor ids. */
  slug: string;
  /** Display index, e.g. "01". */
  index: string;
  title: string;
  description: string;
  /** Verified metrics only. Empty array renders no metrics row. */
  metrics: readonly string[];
  tech: readonly string[];
  /** Verified repository URL. `null` hides the action entirely (see spec §17). */
  repo: string | null;
  /** Verified live/demo URL. `null` hides the action entirely (see spec §17). */
  demo: string | null;
  /** Extra verified detail, shown as a footnote. */
  note?: string;
  /** Which abstract visual to render. Never a fake screenshot (see spec §19). */
  visual: "pipeline" | "cipher" | "ladder" | "polarity";
  featured: boolean;
};

export type SkillGroup = {
  index: string;
  name: string;
  /** Short technical label for the group, rendered in mono. */
  code: string;
  skills: readonly string[];
};

export const profile = {
  name: "Ch V M Kiran",
  displayName: "CH V M KIRAN",
  role: "SOFTWARE ENGINEER · FSD · AI/ML",
  positioning: "Software Engineering · AI/ML · Full Stack Dev",
  location: "Pithapuram, Andhra Pradesh, India",
  email: "chvmkiran639@gmail.com",
  phone: "+91 82478 29971",
  siteUrl: "https://www.chvmkiran.me",
  summary:
    "Final-year CSE (AI & ML) student engineering scalable backend systems and shipping ML pipelines into reliable REST APIs. LeetCode Knight, top 4% globally.",
  /** Hero intro, derived from `summary` above. */
  heroIntro:
    "I build scalable backend systems and ship machine-learning pipelines into reliable REST APIs — currently finishing a B.Tech in CSE (AI & ML).",
  /**
   * Hero portrait.
   *
   * Imported rather than referenced by a `/public` URL so `next/image` reads
   * the intrinsic dimensions and blur placeholder off the file itself, and so a
   * missing asset is a build error instead of a broken image on a live page.
   * The component still renders an honest typographic panel if this is ever
   * null, rather than substituting stock imagery (spec §5, §46).
   */
  image: {
    src: profilePhoto,
    alt: "Ch V M Kiran, photographed against a plain light background.",
  } as { src: StaticImageData; alt: string } | null,
  /**
   * Resume PDF, served from `public/` (spec §50).
   *
   * Every resume action — navbar, hero, mobile nav — renders only when this is
   * set, so the site can never ship a link to a file that is not there.
   */
  resumeUrl: "/resume.pdf" as string | null,
} as const;

export const socials = [
  { label: "GitHub", href: "https://github.com/ChVMKiran" },
  { label: "LinkedIn", href: "https://linkedin.com/in/ChVMKiran" },
  { label: "LeetCode", href: "https://leetcode.com/u/ChVMKiran" },
  { label: "Portfolio", href: "https://www.chvmkiran.me" },
] as const;

export type Stat = {
  value: number;
  suffix: string;
  label: string;
  context: string;
  /** Decimal places for the displayed figure. Omitted means whole numbers. */
  decimals?: number;
};

/**
 * Quick stats (spec §12). `900+` and `1900+` are LeetCode-specific figures —
 * confirmed, and reconciled against the achievements list below, which
 * previously said "800+ problems" for the same platform.
 */
export const stats: readonly Stat[] = [
  { value: 900, suffix: "+", label: "Problems solved", context: "LeetCode" },
  { value: 1900, suffix: "+", label: "LeetCode rating", context: "Knight · top 4%" },
  { value: 8.35, suffix: "", label: "CGPA", context: "B.Tech CSE (AI & ML)", decimals: 2 },
];

export const skillGroups: readonly SkillGroup[] = [
  {
    index: "01",
    name: "Languages",
    code: "LANG",
    skills: ["C/C++", "Python", "Java", "JavaScript", "TypeScript"],
  },
  {
    index: "02",
    name: "Web",
    code: "WEB",
    skills: [
      "React.js",
      "Next.js",
      "Node.js",
      "Express.js",
      "REST APIs",
      "HTML",
      "CSS",
      "Tailwind CSS",
    ],
  },
  {
    index: "03",
    name: "Core CS",
    code: "CORE",
    skills: ["DSA", "OOP", "DBMS", "OS", "Computer Networks"],
  },
  {
    index: "04",
    name: "Data & Cloud",
    code: "CLOUD",
    skills: [
      "MongoDB",
      "SQL",
      "AWS EC2",
      "AWS S3",
      "Load Balancing",
      "Auto Scaling",
    ],
  },
  {
    index: "05",
    name: "ML",
    code: "ML",
    skills: [
      "Supervised Learning",
      "Scikit-Learn",
      "Pandas",
      "NumPy",
      "ML Pipeline Integration",
    ],
  },
  {
    index: "06",
    name: "Tools & DevOps",
    code: "OPS",
    skills: ["Docker", "Kubernetes", "Git", "GitHub", "Postman"],
  },
] as const;

export const projects: readonly Project[] = [
  {
    slug: "farmo-phile",
    index: "01",
    title: "Farmo-Phile",
    description:
      "MERN crop recommendation, rotation, fertilizer and yield prediction platform with an ML pipeline and rate-limited inference.",
    metrics: [
      "99.3% accuracy",
      "R² 0.97",
      "100 requests/minute rate-limited inference",
    ],
    tech: ["React", "Node.js", "Express", "MongoDB", "Scikit-Learn"],
    repo: null,
    demo: null,
    visual: "pipeline",
    featured: true,
  },
  {
    slug: "shadow-note",
    index: "02",
    title: "Shadow Note",
    description:
      "Secure notes application with JWT authentication, MongoDB schemas, and an asynchronous backend flow.",
    metrics: [],
    tech: ["MERN", "REST APIs", "JWT", "MongoDB"],
    repo: null,
    demo: null,
    visual: "cipher",
    featured: true,
  },
  {
    slug: "level-up-dev",
    index: "03",
    title: "Level Up Dev",
    description:
      "Tiered coding-challenge platform with in-browser HTML/CSS/JavaScript evaluation using DOM manipulation and persistent progress.",
    metrics: [],
    tech: ["JavaScript", "HTML", "CSS", "Local Storage"],
    repo: null,
    demo: null,
    note: "Led a 6-member team.",
    visual: "ladder",
    featured: true,
  },
  {
    slug: "movie-review-sentiment-analyzer",
    index: "04",
    title: "Movie Review Sentiment Analyzer",
    description:
      "Python/ML sentiment classification project involving text cleaning, vectorisation, and supervised classification.",
    metrics: [],
    tech: ["Python", "Scikit-Learn", "Pandas", "NLP"],
    repo: null,
    demo: null,
    visual: "polarity",
    featured: true,
  },
  {
    slug: "finmate",
    index: "05",
    title: "Finmate",
    description: "Financial guidance web page.",
    metrics: [],
    tech: ["HTML", "CSS", "JavaScript"],
    repo: null,
    demo: null,
    visual: "polarity",
    featured: false,
  },
  {
    slug: "to-do-list",
    index: "06",
    title: "To-Do List",
    description: "React task application with localStorage persistence.",
    metrics: [],
    tech: ["React", "CSS", "Local Storage"],
    repo: null,
    demo: null,
    visual: "ladder",
    featured: false,
  },
  {
    slug: "weather-now",
    index: "07",
    title: "Weather Now",
    description: "Live weather lookup using a public API with error-state handling.",
    metrics: [],
    tech: ["HTML", "CSS", "JavaScript", "REST API"],
    repo: null,
    demo: null,
    visual: "polarity",
    featured: false,
  },
  {
    slug: "calculator",
    index: "08",
    title: "Calculator",
    description: "Keyboard-aware calculator supporting chained arithmetic.",
    metrics: [],
    tech: ["HTML", "CSS", "JavaScript"],
    repo: null,
    demo: null,
    visual: "cipher",
    featured: false,
  },
  {
    slug: "tic-tac-toe",
    index: "09",
    title: "Tic Tac Toe",
    description:
      "Two-player game with win/draw detection across all eight winning lines.",
    metrics: [],
    tech: ["HTML", "CSS", "JavaScript"],
    repo: null,
    demo: null,
    visual: "ladder",
    featured: false,
  },
] as const;

export const featuredProjects = projects.filter((p) => p.featured);

export const experience = [
  {
    index: "01",
    role: "Intern",
    org: "LG Soft India Pvt Ltd",
    period: "July 2026 – Current",
    current: true,
    description:
      "Production software, API design, data modelling, debugging in a large-scale codebase.",
  },
  {
    index: "02",
    role: "Web Development Intern",
    org: "Technical Hub Pvt Ltd",
    // Two separate stints, rendered as a comma-separated list rather than one
    // malformed range (the source spec wrote them joined by a middle dot).
    period: "May–June 2025, May–June 2026",
    current: false,
    description:
      "Built the browser-based online compiler, integrated for 2,000 concurrent learners.",
  },
] as const;

export const education = {
  degree: "B.Tech CSE (AI & ML)",
  institution: "Aditya College of Engineering & Technology, Surampalem",
  dates: "Sep 2023 – June 2027",
  cgpa: "8.35",
  focus: ["Machine Learning", "Data Structures", "Backend Systems", "Cloud"],
} as const;

export const certifications = [
  { name: "AWS Certified AI Practitioner", issuer: "Amazon Web Services" },
  { name: "GitHub Foundations", issuer: "GitHub" },
  { name: "Oracle Java Certified Foundations Associate", issuer: "Oracle" },
  { name: "Oracle Database Foundations Associate", issuer: "Oracle" },
  { name: "IT Specialist HTML & CSS", issuer: "Pearson" },
] as const;

export const achievements = [
  {
    platform: "LeetCode",
    headline: "Knight",
    detail: "1900+ rating · top 4% · 900+ problems",
  },
  {
    platform: "GeeksforGeeks",
    headline: "4-star",
    detail: "1860+ · top 3% · 300+ problems",
  },
  {
    platform: "Codeforces",
    headline: "Pupil",
    detail: "1200+",
  },
  {
    platform: "CodeChef",
    headline: "2-star",
    detail: "max 1528",
  },
  {
    platform: "Elite Coder",
    headline: "Rank 1 of 7",
    detail: "among 2,000+ first-years",
  },
] as const;

export const sections = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "achievements", label: "Achievements" },
  { id: "contact", label: "Contact" },
] as const;

export type SectionId = (typeof sections)[number]["id"];
