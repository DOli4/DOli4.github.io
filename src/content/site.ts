import type { SiteContent } from './types';

export const siteContent: SiteContent = {
  name: 'Dieter Olivier',
  role: 'Full-Stack Developer — frontend leaning',
  hook: 'Shipping production apps end-to-end — from React Native UI to Spring Boot APIs.',
  location: 'Final-year @ Belgium Campus, Pretoria ZA',

  about:
    'Full-stack developer who leans frontend, with hands-on experience shipping a production React Native/Expo mobile app — from authentication and maps to on-device document generation and responsive design across phone and tablet. On the backend, contributes to a Java/Spring Boot microservices architecture, writing REST APIs, service logic, and unit tests within an enterprise codebase. Cares about clean, typed code; comfortable moving between TypeScript, Java, and Angular.',

  skills: [
    {
      heading: 'Frontend & Mobile',
      lead: true,
      items: [
        'React Native + Expo (SDK 54, EAS build)',
        'TypeScript (strict)',
        'React Navigation (native-stack + drawer)',
        'AWS Amplify Auth / Cognito (email, Google, Apple)',
        'Axios (custom client w/ interceptors)',
        'react-native-maps + directions',
        'on-device PDF/CSV (expo-print, expo-file-system, react-native-pdf)',
        'Expo/FCM push notifications',
        'custom hooks/context (theming, responsive scaling, auth, notifications)',
        'responsive phone/tablet design',
      ],
    },
    {
      heading: 'Backend',
      items: [
        'Java 24',
        'Spring Boot 3.5',
        'Spring Data JPA / Hibernate',
        'PostgreSQL',
        'Spring Security (OAuth2 resource server, JWT, custom permissions)',
        'multi-module Maven monorepo',
        'JUnit 5 / Mockito / AssertJ',
      ],
    },
    {
      heading: 'Familiar With',
      items: [
        'Angular (standalone components, Reactive Forms, Angular Material, RxJS)',
        'NgRx',
        'JMS/ActiveMQ',
        'OpenAPI/Swagger',
        'Docker',
        'CI/CD (Jenkins, Azure Pipelines)',
        'quality tooling (Spotless, PMD, SpotBugs, SonarQube)',
      ],
    },
  ],

  projects: [
    {
      title: 'Cross-Platform Mobile App',
      blurb:
        'Production React Native/Expo/TypeScript app: multi-provider auth (Cognito, Google, Apple), maps, push notifications, on-device PDF/CSV export.',
      tags: ['React Native', 'Expo', 'TypeScript', 'AWS Cognito', 'Google Maps'],
    },
    {
      title: 'Responsive Mobile UI Overhaul',
      blurb:
        'Led a full responsive-design pass across a ~17-screen app; shared scaling system for phone/tablet; consolidated styles into a reusable design layer.',
      tags: ['React Native', 'TypeScript', 'Responsive Design', 'Design Systems'],
    },
    {
      title: 'Document Export & Sharing Flow',
      blurb:
        'Date-range picker → on-device PDF/CSV generation → native share, with cancellable requests and error handling.',
      tags: ['Expo', 'React Native', 'Axios', 'UX'],
    },
    {
      title: 'Microservices REST API',
      blurb:
        'Contributed endpoints, service logic, and unit tests to a multi-service Spring Boot backend with JWT auth and a shared data layer.',
      tags: ['Java', 'Spring Boot', 'Spring Security', 'PostgreSQL', 'JUnit/Mockito'],
      confidential: true,
    },
    {
      title: 'Admin Web Module',
      blurb:
        'Form-driven admin feature using Angular standalone components, Reactive Forms with async validation, Angular Material.',
      tags: ['Angular', 'RxJS', 'Angular Material'],
      confidential: true,
    },
  ],

  experience: [
    'Built and shipped a cross-platform React Native/Expo mobile app end-to-end (auth, core workflows, admin views), released via EAS to iOS and Android.',
    'Implemented multi-provider authentication (email/password, Google, Apple) on AWS Cognito, with token refresh, session resumption, and role-based routing.',
    'Designed an in-app document export flow — on-device PDF/CSV generation with date-range selection, cancellable requests, and native share.',
    'Built a map feature with Google Maps route/directions overlays and geolocation.',
    'Led a responsive-design pass across ~17 screens with a shared scaling system and consolidated style layer.',
    'Contributed REST endpoints and service-layer logic to a Java/Spring Boot microservices backend (Controller → Service → Repository).',
    'Wrote backend unit tests (JUnit 5 / Mockito / AssertJ); used SonarQube quality gates to drive coverage and refactoring.',
    'Contributed an Angular admin feature module (Reactive Forms, Angular Material, RxJS async validation).',
  ],

  contact: {
    email: 'Oli4Dieter@gmail.com',
    linkedin: 'https://www.linkedin.com/in/dieter-olivier-0b7799162/',
    github: 'https://github.com/DOli4',
  },
};

export default siteContent;
