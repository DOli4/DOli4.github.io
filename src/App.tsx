import { MotionConfig } from "framer-motion";
import GrainOverlay from "./components/GrainOverlay";
import Footer from "./components/Footer";
import Hero from "./sections/Hero";
import About from "./sections/About";
import Skills from "./sections/Skills";
import Work from "./sections/Work";
import Experience from "./sections/Experience";
import Contact from "./sections/Contact";
import { PlaygroundProvider, usePlayground } from "./playground/ThemeContext";
import CustomizePanel from "./playground/CustomizePanel";

function Shell() {
  const { motion } = usePlayground();

  return (
    <MotionConfig reducedMotion={motion === "reduced" ? "always" : "user"}>
      <main className="min-h-screen bg-base text-ink">
        <GrainOverlay />

        <Hero />
        <About />
        <Skills />
        <Work />
        <Experience />
        <Contact />
        <Footer />

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
