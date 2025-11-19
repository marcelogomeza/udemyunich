
import React, { useState, useEffect } from 'react';
import { User, LearningPath, Course } from '../types';
import { api } from '../services/api';
import { MOCK_PATHS, getLeaderboardData } from '../mockData';
import MountainPath from './MountainPath';
import LeaderboardChart from './LeaderboardChart';
import { ChevronDown, Clock, Trophy, PlayCircle, CheckCircle, Lock } from 'lucide-react';

interface Props {
  user: User;
}

const UserDashboard: React.FC<Props> = ({ user: initialUser }) => {
  // State
  const [user, setUser] = useState<User>(initialUser);
  const [selectedPathId, setSelectedPathId] = useState<number>(
    initialUser.enrolledPaths.length > 0 ? initialUser.enrolledPaths[0] : MOCK_PATHS[0].id
  );
  const [loading, setLoading] = useState(false);
  const [currentPathTitle, setCurrentPathTitle] = useState<string>("");
  const [courses, setCourses] = useState<Course[]>([]);

  // Load User Details when Path Changes
  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch full user details + course progress for this path
            const userDetails = await api.getUserDetails(user.email, selectedPathId);
            setUser(userDetails);
            
            if (userDetails.currentPathCourses) {
                setCourses(userDetails.currentPathCourses);
            } else {
                // Fallback for mock title/courses if API is down
                const fallbackPath = MOCK_PATHS.find(p => p.id === selectedPathId);
                if (fallbackPath) {
                    setCourses(fallbackPath.courses);
                    setCurrentPathTitle(fallbackPath.title);
                }
            }

            // If we fetched real data, try to find title in MOCK for now or from API if we extended it
            const pathRef = MOCK_PATHS.find(p => p.id === selectedPathId);
            if (pathRef) setCurrentPathTitle(pathRef.title);

        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };
    loadData();
  }, [selectedPathId, user.email]);

  // Mock Leaderboard (since API doesn't return full leaderboard in single call yet)
  const leaderboardData = getLeaderboardData(selectedPathId).map(entry => ({
    ...entry,
    isCurrentUser: entry.email === user.email
  }));

  const pathStats = {
    progress: user.stats.totalProgress,
    completed: user.stats.coursesCompleted,
    inProgress: user.stats.coursesInProgress,
    lastActivity: user.stats.lastActivity
  };

  if (loading && courses.length === 0) return <div className="p-20 text-center">Cargando datos...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-40 shadow-sm">
        <div className="flex items-center space-x-3 mb-4 md:mb-0">
           <div className="w-10 h-10 bg-brand-purple rounded-lg flex items-center justify-center text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z"/></svg>
           </div>
           <div>
              <div className="text-xs text-gray-500 font-semibold tracking-wide uppercase">Plataforma de Aprendizaje</div>
              <div className="text-xl font-bold text-gray-800">ascensus</div>
           </div>
        </div>

        <div className="w-full md:w-1/2 max-w-2xl">
            <label className="text-xs text-gray-500 font-medium ml-1 mb-1 block">Vía de aprendizaje actual</label>
            <div className="relative group">
                <select 
                    className="w-full p-3 pl-4 pr-10 border border-gray-300 rounded-xl bg-white text-gray-700 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                    value={selectedPathId}
                    onChange={(e) => setSelectedPathId(Number(e.target.value))}
                >
                    {user.enrolledPaths.map(pathId => {
                        const p = MOCK_PATHS.find(mp => mp.id === pathId);
                        return <option key={pathId} value={pathId}>{p?.title || `Vía #${pathId}`}</option>
                    })}
                </select>
                <ChevronDown className="absolute right-4 top-3.5 h-5 w-5 text-gray-400 pointer-events-none group-hover:text-purple-600 transition-colors" />
            </div>
        </div>
        
        <div className="hidden md:block w-10"></div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Path Title */}
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{currentPathTitle || "Cargando..."}</h1>
                <p className="text-gray-500 mt-1">Sigue tu progreso y alcanza la meta.</p>
            </div>
            <a href="#" className="text-brand-purple font-medium hover:underline hidden md:block text-sm border border-brand-purple px-4 py-2 rounded-full hover:bg-brand-light transition-colors">
                Ir a la Vía de aprendizaje
            </a>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-2 -mt-2"></div>
                <h3 className="text-xs text-gray-500 font-bold uppercase tracking-wider relative z-10">Avance total</h3>
                <div className="mt-2 flex items-end gap-2 relative z-10">
                    <span className="text-4xl font-bold text-gray-900">{pathStats.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${pathStats.progress}%` }}></div>
                </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xs text-gray-500 font-bold uppercase tracking-wider">Última actividad</h3>
                <div className="mt-2">
                    <span className="text-2xl font-semibold text-gray-800">{pathStats.lastActivity?.split('T')[0]}</span>
                </div>
                <div className="mt-3 text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={12} /> 
                </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xs text-gray-500 font-bold uppercase tracking-wider">Cursos completados</h3>
                <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">{pathStats.completed}</span>
                    <span className="text-gray-400 text-sm ml-1">/ {courses.length}</span>
                </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xs text-gray-500 font-bold uppercase tracking-wider">Cursos en progreso</h3>
                <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">{pathStats.inProgress}</span>
                </div>
            </div>
        </div>

        {/* Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Course List */}
            <div className="lg:col-span-2 space-y-6">
                {/* Group by Category */}
                {Array.from(new Set(courses.map(c => c.category))).map(category => (
                    <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                            <h3 className="font-bold text-gray-800">{category}</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {courses.filter(c => c.category === category).map(course => (
                                <div key={course.id} className="p-5 hover:bg-gray-50 transition-colors flex items-start gap-4">
                                    <div className="mt-1">
                                        {course.isCompleted ? (
                                            <CheckCircle className="text-lime-500" size={24} />
                                        ) : course.progress > 0 ? (
                                            <PlayCircle className="text-blue-500" size={24} />
                                        ) : (
                                            <Lock className="text-gray-300" size={24} />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 text-base mb-1">{course.title}</h4>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[200px]">
                                                <div 
                                                    className={`h-2 rounded-full ${course.isCompleted ? 'bg-lime-500' : 'bg-blue-500'}`} 
                                                    style={{ width: `${course.progress}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm text-gray-500 font-medium">{course.progress}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Leaderboard */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Trophy className="text-yellow-500" />
                        <h3 className="text-lg font-bold text-gray-900">Tu posición en la ruta</h3>
                    </div>
                    <LeaderboardChart data={leaderboardData} />
                </div>
            </div>

            {/* Right Column: Mountain Visual */}
            <div className="lg:col-span-1">
                <div className="sticky top-24">
                    <MountainPath courses={courses} />
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
