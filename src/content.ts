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

// "What you get if you hire me" — the corporate pitch. Shown as a coverflow
// preview on the CV page, and in full on the #/hire screen. Images are known
// Unsplash stock (premium, neutral) — the overlay names the capability.
export type Capability = {
  slug: string;
  title: string;
  subtitle: string;
  pitch: string;
  points: string[];
  image: string;
};

const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=720&h=720&fit=crop&q=70&auto=format`;

export const capabilities: Capability[] = [
  {
    slug: "mobile",
    title: "Mobile apps people love",
    subtitle: "React Native · design systems",
    pitch:
      "Hand me two mockups and I'll give you a whole app. I build the entire mobile interface — a design system and reusable component library from scratch — so every screen feels considered and consistent.",
    points: [
      "Design system & component library",
      "Custom hooks + shared state",
      "Smooth, native-feeling UX",
    ],
    image: UNSPLASH("1519681393784-d120267933ba"),
  },
  {
    slug: "fullstack",
    title: "Full-stack, end to end",
    subtitle: "Java · Spring Boot · Angular",
    pitch:
      "I ship features the whole way down — from the database migration to the button the user clicks. Web portal and the services behind it, delivered as one coherent piece of work.",
    points: [
      "Role-based permissions",
      "Auditable change tracking",
      "Migrations to UI, one owner",
    ],
    image: UNSPLASH("1441974231531-c6227db76b6e"),
  },
  {
    slug: "backend",
    title: "Backend that scales",
    subtitle: "Spring Boot · PostgreSQL",
    pitch:
      "Well-tested, well-measured services that hold up when the load spikes. REST APIs and microservices built to scale quietly rather than break loudly.",
    points: [
      "REST APIs & microservices",
      "Spring Data JPA · PostgreSQL",
      "Tested and measured",
    ],
    image: UNSPLASH("1500534314209-a25ddb2bd429"),
  },
  {
    slug: "performance",
    title: "Fast, correct reporting",
    subtitle: "SQL tuning · PDF pipelines",
    pitch:
      "I make slow things fast and wrong things right — optimising heavy queries and rebuilding export pipelines so reporting is quick and trustworthy.",
    points: [
      "Query optimisation",
      "HTML-to-PDF reporting",
      "Measured, not guessed",
    ],
    image: UNSPLASH("1470071459604-3b5ec3a7fe05"),
  },
  {
    slug: "craft",
    title: "Craft & collaboration",
    subtitle: "CI/CD · code review",
    pitch:
      "I work the way good teams do: pull-request reviews, CI/CD, tests, and an eye on accessibility. Rated excellent for deadlines, teamwork and communication.",
    points: [
      "Jenkins CI/CD · Azure DevOps",
      "Pull-request code review",
      "Accessibility basics",
    ],
    image: UNSPLASH("1465101162946-4377e57745c3"),
  },
];

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
