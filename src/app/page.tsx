import { About } from "@/components/portfolio/About";
import { Achievements } from "@/components/portfolio/Achievements";
import { Certifications } from "@/components/portfolio/Certifications";
import { Contact } from "@/components/portfolio/Contact";
import { Education } from "@/components/portfolio/Education";
import { Experience } from "@/components/portfolio/Experience";
import { Hero } from "@/components/portfolio/Hero";
import { Projects } from "@/components/portfolio/Projects";
import { Skills } from "@/components/portfolio/Skills";
import { Stats } from "@/components/portfolio/Stats";

/**
 * Section order follows the spec's story rhythm (§51, §53):
 * high → medium → spatial → highest → controlled → calm → typographic → minimal.
 */
export default function Page() {
  return (
    <>
      <Hero />
      <About />
      <Stats />
      <Skills />
      <Projects />
      <Experience />
      <Education />
      <Certifications />
      <Achievements />
      <Contact />
    </>
  );
}
