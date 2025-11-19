
export interface Course {
  id: number;
  title: string;
  isCompleted: boolean;
  progress: number;
  category: string;
}

export interface LearningPath {
  id: number;
  title: string;
  totalCourses: number;
  courses: Course[];
  description?: string;
}

export interface UserStats {
  totalProgress: number;
  lastActivity: string;
  coursesCompleted: number;
  coursesInProgress: number;
}

export interface User {
  email: string;
  name: string;
  avatar?: string;
  stats: UserStats;
  enrolledPaths: number[]; // IDs of paths
}

export interface LeaderboardEntry {
  email: string;
  name: string;
  progress: number;
  isCurrentUser: boolean;
  avatar?: string;
}

export interface AdminViewUser extends User {
  id: string;
}
