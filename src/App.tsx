import { MotionConfig, motion, useScroll } from "framer-motion";
import GrainOverlay from "./components/GrainOverlay";
import Footer from "./components/Footer";
import Hero from "./sections/Hero";
import About from "./sections/About";
import Skills from "./sections/Skills";
import Work from "./sections/Work";
import Experience from "./sections/Experience";
import Sandbox from "./sections/Sandbox";
import Contact from "./sections/Contact";
import { PlaygroundProvider, usePlayground } from "./playground/ThemeContext";
import CustomizePanel from "./playground/CustomizePanel";

function Shell() {
  const { motion: motionPref } = usePlayground();
  const { scrollYProgress } = useScroll();

  return (
    <MotionConfig reducedMotion={motionPref === "reduced" ? "always" : "user"}>
      {/* scroll-progress bar — ties the whole journey together */}
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="fixed left-0 right-0 top-0 z-[70] h-1 origin-left bg-accent"
      />

      <main className="min-h-screen bg-base text-ink">
        <GrainOverlay />

        <Hero />
        <About />
        <Skills />
        <Work />
        <Experience />
        <Sandbox />
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
