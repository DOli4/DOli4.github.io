// All CV copy lives here so it's easy to edit without touching layout.
// Anonymous by design: no company names, no client names, no internal packages.

export const profile = {
  name: "Dieter Olivier",
  tagline: "Full-stack developer with a frontend heart — I've owned an entire mobile UI and the services behind it.",
  location: "Pretoria, South Africa",
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
  "I'm a full-stack developer who leans toward the frontend — the part where code meets the person using it. I spent my final university year working full-time in industry, shipping production features across a Java / Spring Boot backend, an Angular web portal, and a React Native mobile app.",
  "On the mobile side I was handed mockups for two screens and grew them into a complete, theme-consistent interface across the whole app — a design system and reusable component library built from scratch, with custom hooks, React Context and React Navigation.",
  "I care about how things feel: interfaces that stay quiet until you need them, and systems underneath that hold up when the load spikes. Performance, code quality, and building things that scale rather than break. Bachelor of Computing, 22 distinctions.",
];

export type SkillGroup = { title: string; items: string[] };

export const skills: SkillGroup[] = [
  {
    title: "Frontend & Mobile",
    items: ["React", "React Native", "Expo", "TypeScript", "Angular", "NgRx", "SCSS", "Design systems"],
  },
  {
    title: "Backend",
    items: ["Java", "Spring Boot", "Spring Data JPA", "REST APIs", "Microservices", "PostgreSQL", "Node.js", "Express"],
  },
  {
    title: "Cloud & DevOps",
    items: ["Cloudflare", "AWS (Cognito · S3 · SES)", "Docker", "Jenkins CI/CD", "Azure DevOps", "Git"],
  },
  {
    title: "Also",
    items: ["Python", "C#", "MongoDB", "Unity", "Testing", "Accessibility"],
  },
];

export type Project = {
  title: string;
  blurb: string;
  tags: string[];
};

export const projects: Project[] = [
  {
    title: "Mobile UI & design system",
    blurb:
      "Two mockups became a full app. I extended the look and feel into a complete, theme-consistent interface, building a design system and reusable component library from scratch — custom hooks, shared state, and navigation — while reworking nearly every screen.",
    tags: ["React Native", "Design system", "TypeScript"],
  },
  {
    title: "Full-stack e-commerce backend",
    blurb:
      "A scalable Node.js / Express / MongoDB backend with sharding and replication behind a clean RESTful API — built to stay quick and correct as the data grows.",
    tags: ["Node.js", "MongoDB", "REST"],
  },
  {
    title: "Community web platform",
    blurb:
      "A responsive full-stack platform designed and built solo, end to end — front and back — on Node.js, Express, MongoDB and EJS.",
    tags: ["Node.js", "Express", "Full-stack"],
  },
  {
    title: "AI interview simulator",
    blurb:
      "Led a ten-person team building a VR mock-interview platform in Python and Unity for the Meta Quest 3. Final-year capstone, scored a distinction.",
    tags: ["Python", "Unity", "Team lead"],
  },
];
