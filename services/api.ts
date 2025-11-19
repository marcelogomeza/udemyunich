
import { MOCK_PATHS, MOCK_USERS } from '../mockData';
import { LearningPath, User, Course, LeaderboardEntry } from '../types';

const API_URL = 'backend/api.php'; // Relative path to the PHP API

// Helper to simulate delay if using mock
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  async getPaths(): Promise<LearningPath[]> {
    try {
      const res = await fetch(`${API_URL}?action=get_paths`);
      if (!res.ok) throw new Error('API unavailable');
      return await res.json();
    } catch (e) {
      console.warn('Using Mock Data for Paths');
      return MOCK_PATHS;
    }
  },

  async getPathUsers(pathId: number): Promise<any[]> {
    try {
      const res = await fetch(`${API_URL}?action=get_path_users&path_id=${pathId}`);
      if (!res.ok) throw new Error('API unavailable');
      return await res.json();
    } catch (e) {
      console.warn('Using Mock Data for Path Users');
      return MOCK_USERS.filter(u => u.enrolledPaths.includes(pathId));
    }
  },

  async getUserDetails(email: string, pathId?: number): Promise<User & { currentPathCourses?: Course[] }> {
    try {
        const res = await fetch(`${API_URL}?action=get_user_stats&email=${email}&path_id=${pathId}`);
        if (!res.ok) throw new Error('API unavailable');
        
        const data = await res.json();
        // Transform PHP API response to Frontend Type if needed
        return {
            email: data.email,
            name: data.name,
            enrolledPaths: data.enrolledPaths || [],
            stats: {
                totalProgress: Math.round(data.stats?.totalProgress || 0),
                lastActivity: data.stats?.lastActivity || '-',
                coursesCompleted: data.path_courses?.filter((c: any) => c.status === 'completed').length || 0,
                coursesInProgress: data.path_courses?.filter((c: any) => c.status === 'in_progress').length || 0
            },
            currentPathCourses: data.path_courses?.map((c: any) => ({
                id: c.id,
                title: c.title,
                category: c.category || 'General',
                progress: Math.round(c.progress),
                isCompleted: c.status === 'completed'
            }))
        };

    } catch (e) {
        console.warn('Using Mock Data for User Details');
        const user = MOCK_USERS.find(u => u.email === email);
        if (!user) throw new Error('User not found');
        
        // Enrich mock user with course details for the dashboard
        const path = MOCK_PATHS.find(p => p.id === pathId);
        const enhancedUser = {
            ...user,
            currentPathCourses: path?.courses || []
        };
        return enhancedUser;
    }
  }
};
