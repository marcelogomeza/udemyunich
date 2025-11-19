
import { LearningPath, User, LeaderboardEntry } from './types';

export const MOCK_PATHS: LearningPath[] = [
  {
    id: 3854614,
    title: "PLAN DE FORMACIÓN 2025 ANDRES LEONARDO CHAVEZ",
    totalCourses: 4,
    description: "Ruta especializada en diseño y producto.",
    courses: [
      { id: 101, title: "Trabajar con OKRs: Conocimientos y Creencias Fundamentales", isCompleted: true, progress: 100, category: "Adaptabilidad y Flexibilidad" },
      { id: 102, title: "UX Writing: diseño de contenido y experiencia de usuario", isCompleted: true, progress: 100, category: "Técnica" },
      { id: 103, title: "Diseño UI: diseño visual y diseño de interfaz con Figma 2025", isCompleted: false, progress: 45, category: "Técnica" },
      { id: 104, title: "Diseño UX: experiencia de usuario UX/UI + Figma 2025", isCompleted: false, progress: 0, category: "Técnica" }
    ]
  },
  {
    id: 999999,
    title: "Udemy Business Enablement Week 2: UB Product",
    totalCourses: 5,
    description: "Onboarding para producto.",
    courses: [
      { id: 201, title: "Product Management 101", isCompleted: false, progress: 10, category: "Product" },
      { id: 202, title: "Agile Fundamentals", isCompleted: false, progress: 0, category: "Methodology" },
      { id: 203, title: "Scrum Master Class", isCompleted: false, progress: 0, category: "Methodology" },
      { id: 204, title: "Jira for Beginners", isCompleted: false, progress: 0, category: "Tools" },
      { id: 205, title: "Product Roadmap Strategy", isCompleted: false, progress: 0, category: "Strategy" }
    ]
  }
];

export const MOCK_USERS: User[] = [
  {
    email: "aatienza@cognosonline.com.mx",
    name: "Ana Atienza",
    stats: { totalProgress: 100, lastActivity: "2025-05-18", coursesCompleted: 4, coursesInProgress: 0 },
    enrolledPaths: [3854614]
  },
  {
    email: "achacha@cognosonline.com.mx",
    name: "Alberto Chacha",
    stats: { totalProgress: 100, lastActivity: "2025-05-19", coursesCompleted: 4, coursesInProgress: 0 },
    enrolledPaths: [3854614]
  },
  {
    email: "achaves@cognosonline.com",
    name: "Andres Leonardo Chavez",
    stats: { totalProgress: 62, lastActivity: "2025-05-20", coursesCompleted: 2, coursesInProgress: 1 },
    enrolledPaths: [3854614, 999999]
  },
  {
    email: "agonzalez@cognosonline.com",
    name: "Alberto Gonzalez",
    stats: { totalProgress: 25, lastActivity: "2025-05-10", coursesCompleted: 1, coursesInProgress: 1 },
    enrolledPaths: [3854614]
  },
  {
    email: "alejandro.perez@udemy.com",
    name: "Alejandro Perez",
    stats: { totalProgress: 0, lastActivity: "-", coursesCompleted: 0, coursesInProgress: 0 },
    enrolledPaths: [3854614]
  },
  {
    email: "asantamaria@cognosonline.com.mx",
    name: "Ana Santamaria",
    stats: { totalProgress: 100, lastActivity: "2025-05-15", coursesCompleted: 4, coursesInProgress: 0 },
    enrolledPaths: [3854614]
  }
];

export const getLeaderboardData = (pathId: number): LeaderboardEntry[] => {
  // Generating leaderboard based on mock users for the selected path
  const usersInPath = MOCK_USERS.filter(u => u.enrolledPaths.includes(pathId));
  
  // Map to leaderboard entry
  return usersInPath.map(u => ({
    email: u.email,
    name: u.name,
    progress: u.stats.totalProgress,
    isCurrentUser: false // This will be set by the component
  })).sort((a, b) => b.progress - a.progress);
};
