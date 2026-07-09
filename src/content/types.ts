export interface Project {
  title: string;
  blurb: string;
  tags: string[];
  confidential?: boolean;
}

export interface SkillGroup {
  heading: string;
  lead?: boolean;
  items: string[];
}

export interface SiteContent {
  name: string;
  role: string;
  hook: string;
  location: string;
  about: string;
  skills: SkillGroup[];
  projects: Project[];
  experience: string[];
  contact: {
    email: string;
    linkedin: string;
    github: string;
  };
}
