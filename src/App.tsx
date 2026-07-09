import GrainOverlay from "./components/GrainOverlay";
import Section from "./components/Section";

function App() {
  return (
    <main className="min-h-screen bg-base text-ink">
      <GrainOverlay />

      <Section id="hero">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          <span className="text-accent">Dieter</span> Oliveira
        </h1>
      </Section>

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
    </main>
  );
}

export default App;
