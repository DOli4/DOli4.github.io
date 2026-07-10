// All CV copy lives here so it's easy to edit without touching layout.
// Anonymous by design: no company names, no client names, no internal packages.

export const profile = {
  name: "Dieter Olivier",
  tagline: "Software engineer — building calm, considered things for the web and mobile.",
  location: "South Africa",
  email: "Oli4Dieter@gmail.com",
  linkedin: {
    label: "dieter-olivier",
    url: "https://www.linkedin.com/in/dieter-olivier-0b7799162",
  },
  github: {
    label: "DOli4",
    url: "https://github.com/DOli4",
  },
};

export const about = [
  "I'm a full-stack engineer who leans toward the frontend — the part where code meets the person using it.",
  "I like work that feels unhurried and well-made: interfaces that are quiet until you need them, and systems underneath that hold up when things get busy. Most of my days are spent in React, React Native and TypeScript, with a solid stretch of Java and Spring Boot behind the scenes.",
];

export type SkillGroup = { title: string; items: string[] };

export const skills: SkillGroup[] = [
  {
    title: "Frontend",
    items: ["React", "TypeScript", "Tailwind", "Framer Motion", "Vite", "Three.js"],
  },
  {
    title: "Mobile",
    items: ["React Native", "Expo", "Native modules", "Offline-first"],
  },
  {
    title: "Backend",
    items: ["Java", "Spring Boot", "REST APIs", "PostgreSQL", "Microservices"],
  },
  {
    title: "Craft & tooling",
    items: ["Git", "Docker", "Testing", "CI/CD", "SonarQube", "Accessibility"],
  },
];

export type Project = {
  title: string;
  blurb: string;
  tags: string[];
};

export const projects: Project[] = [
  {
    title: "Mobile portal app",
    blurb:
      "A cross-platform React Native app for a fleet & asset platform — everyday tools people actually reach for, with an offline-friendly experience and a focus on feeling fast.",
    tags: ["React Native", "TypeScript", "Mobile"],
  },
  {
    title: "Core services & APIs",
    blurb:
      "Backend services in Java / Spring Boot powering contracts, maintenance and user domains. Well-tested, well-measured, and built to scale quietly.",
    tags: ["Java", "Spring Boot", "Microservices"],
  },
  {
    title: "This little site",
    blurb:
      "A hand-drawn SVG scene, gentle motion, and a palette borrowed from a golden-hour hillside. Built with React + Vite, because a CV can be a calm place too.",
    tags: ["React", "Vite", "SVG"],
  },
];
