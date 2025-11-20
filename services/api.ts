// src/services/api.ts (ajusta ruta según tu estructura)
import { MOCK_PATHS, MOCK_USERS } from '../mockData';
import { LearningPath, User, Course } from '../types';

const API_URL = '/backend/api.php'; // API PHP en raíz/backend

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  async getPaths(): Promise<LearningPath[]> {
    try {
      const res = await fetch(`${API_URL}?action=get_paths`);
      if (!res.ok) throw new Error(`API unavailable: ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error('getPaths error:', e);
      console.warn('Using Mock Data for Paths');
      await delay(400);
      return MOCK_PATHS;
    }
  },

  async getPathUsers(pathId: number): Promise<any[]> {
    try {
      const res = await fetch(`${API_URL}?action=get_path_users&path_id=${pathId}`);
      if (!res.ok) throw new Error(`API unavailable: ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error('getPathUsers error:', e);
      console.warn('Using Mock Data for Path Users');
      await delay(400);
      // Adaptamos MOCK_USERS para que tengan la propiedad stats
      return MOCK_USERS.map(u => ({
        email: u.email,
        name: u.name,
        stats: u.stats
      }));
    }
  },

  async getUserDetails(email: string, pathId: number): Promise<User & { currentPathCourses?: Course[] }> {
    try {
      const res = await fetch(
        `${API_URL}?action=get_user_details&email=${encodeURIComponent(email)}&path_id=${pathId}`
      );
      if (!res.ok) throw new Error(`API unavailable: ${res.status}`);
      const data = await res.json();

      // El backend devuelve un objeto tipo User; opcionalmente podríamos mapear aquí si hiciera falta
      return data;
    } catch (e) {
      console.error('getUserDetails error:', e);
      console.warn('Using Mock Data for User Details');

      const user = MOCK_USERS.find(u => u.email === email);
      if (!user) throw new Error('User not found');

      const path = MOCK_PATHS.find(p => p.id === pathId);
      const enhancedUser: User & { currentPathCourses?: Course[] } = {
        ...user,
        currentPathCourses: path?.courses || []
      };

      return enhancedUser;
    }
  }
};
