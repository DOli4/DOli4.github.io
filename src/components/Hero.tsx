import { motion } from "framer-motion";
import Scene from "./Scene";
import { profile } from "../content";
import "./hero.css";

export default function Hero() {
  return (
    <header className="hero">
      <div className="hero-scene">
        <Scene />
        <div className="hero-fade" />
      </div>

      <div className="hero-copy wrap">
        <motion.p
          className="hero-eyebrow"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {profile.location}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {profile.name}
        </motion.h1>
        <motion.p
          className="hero-tagline"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {profile.tagline}
        </motion.p>
      </div>

      <motion.a
        href="#about"
        className="scroll-cue"
        aria-label="Scroll to content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      >
        <span />
      </motion.a>
    </header>
  );
}
