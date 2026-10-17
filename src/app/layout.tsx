import type { Metadata, Viewport } from "next";
import { Inter, Space_Mono } from "next/font/google";

import { BackgroundAtmosphere } from "@/components/portfolio/BackgroundAtmosphere";
import { CursorFollower } from "@/components/portfolio/CursorFollower";
import { Footer } from "@/components/portfolio/Footer";
import { GuideBot } from "@/components/portfolio/GuideBot";
import { Navbar } from "@/components/portfolio/Navbar";
import { ScrollProgress } from "@/components/portfolio/ScrollProgress";
import { profile, projects, socials } from "@/data/portfolio";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

const description = `${profile.summary} Portfolio of ${profile.name} — ${profile.positioning}.`;

export const metadata: Metadata = {
  metadataBase: new URL(profile.siteUrl),
  title: {
    default: `${profile.name} — ${profile.role}`,
    template: `%s — ${profile.name}`,
  },
  description,
  applicationName: profile.name,
  authors: [{ name: profile.name, url: profile.siteUrl }],
  creator: profile.name,
  publisher: profile.name,
  keywords: [
    "Ch V M Kiran",
    "software engineer",
    "full stack developer",
    "AI ML engineer",
    "Next.js developer",
    "React developer",
    "MERN stack",
    "portfolio",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: profile.siteUrl,
    siteName: `${profile.name} — Portfolio`,
    title: `${profile.name} — ${profile.role}`,
    description,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${profile.name} — ${profile.role}`,
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: "#04050a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

/** Person + WebSite + project ItemList (spec §49). */
function StructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${profile.siteUrl}/#person`,
        name: profile.name,
        jobTitle: profile.positioning,
        email: `mailto:${profile.email}`,
        telephone: profile.phone,
        url: profile.siteUrl,
        description: profile.summary,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Pithapuram",
          addressRegion: "Andhra Pradesh",
          addressCountry: "IN",
        },
        sameAs: socials
          .filter((s) => s.label !== "Portfolio")
          .map((s) => s.href),
        knowsAbout: [
          "Software Engineering",
          "Full Stack Development",
          "Machine Learning",
          "Cloud",
        ],
        alumniOf: {
          "@type": "CollegeOrUniversity",
          name: "Aditya College of Engineering & Technology, Surampalem",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${profile.siteUrl}/#website`,
        url: profile.siteUrl,
        name: `${profile.name} — Portfolio`,
        description,
        inLanguage: "en",
        publisher: { "@id": `${profile.siteUrl}/#person` },
      },
      {
        "@type": "ItemList",
        "@id": `${profile.siteUrl}/#projects`,
        name: "Projects",
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        numberOfItems: projects.length,
        itemListElement: projects.map((project, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "SoftwareSourceCode",
            name: project.title,
            description: project.description,
            // Only real, verified links are emitted — never placeholders (spec §17).
            ...(project.repo ? { codeRepository: project.repo } : {}),
            ...(project.demo ? { url: project.demo } : {}),
            programmingLanguage: project.tech.join(", "),
            author: { "@id": `${profile.siteUrl}/#person` },
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Serialised from local data only; no user input reaches this string.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable}`}>
      <body className="relative min-h-screen bg-ink text-fg">
        <a
          href="#main"
          className="sr-only rounded-sm bg-accent px-4 py-2 text-sm font-medium text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200]"
        >
          Skip to content
        </a>

        <BackgroundAtmosphere />
        <ScrollProgress />
        <Navbar />

        <main id="main">{children}</main>

        <Footer />
        <GuideBot />
        <CursorFollower />

        <StructuredData />
      </body>
    </html>
  );
}
