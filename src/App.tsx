import { MotionConfig } from "framer-motion";
import GrainOverlay from "./components/GrainOverlay";
import Section from "./components/Section";
import Hero from "./sections/Hero";
import { PlaygroundProvider, usePlayground } from "./playground/ThemeContext";
import CustomizePanel from "./playground/CustomizePanel";

function Shell() {
  const { motion } = usePlayground();

  return (
    <MotionConfig reducedMotion={motion === "reduced" ? "always" : "user"}>
      <main className="min-h-screen bg-base text-ink">
        <GrainOverlay />

        <Hero />

        <Section id="about" title="About">
          <p className="text-ink/80">Placeholder about copy.</p>
        </Section>

        <Section id="skills" title="Skills">
          <p className="text-ink/80">Placeholder skills copy.</p>
        </Section>

        <Section id="work" title="Work">
          <p className="text-ink/80">Placeholder work copy.</p>
        </Section>

        <Section id="experience" title="Experience">
          <p className="text-ink/80">Placeholder experience copy.</p>
        </Section>

        <Section id="contact" title="Contact">
          <p className="text-ink/80">Placeholder contact copy.</p>
        </Section>

        <CustomizePanel />
      </main>
    </MotionConfig>
  );
}

function App() {
  return (
    <PlaygroundProvider>
      <Shell />
    </PlaygroundProvider>
  );
}

export default App;
