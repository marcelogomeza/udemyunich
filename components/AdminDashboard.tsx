
import React, { useState } from 'react';
import { MOCK_PATHS, MOCK_USERS } from '../mockData';
import { User } from '../types';
import { Search, Copy, ExternalLink, ChevronDown } from 'lucide-react';

interface Props {
  onSelectUser: (email: string) => void;
}

const AdminDashboard: React.FC<Props> = ({ onSelectUser }) => {
  const [selectedPathId, setSelectedPathId] = useState<number>(MOCK_PATHS[0].id);
  const selectedPath = MOCK_PATHS.find(p => p.id === selectedPathId);
  
  // Filter users enrolled in this path
  const users = MOCK_USERS.filter(u => u.enrolledPaths.includes(selectedPathId));

  const handleCopyUrl = async (email: string) => {
    // Construct URL explicitly for the /unich/ subdirectory
    const baseUrl = window.location.origin + "/unich/";
    const url = `${baseUrl}?view=user&email=${email}`;
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(url);
          alert(`URL copiada: ${url}`);
      } else {
          // Fallback for non-secure contexts or older browsers
          const textArea = document.createElement("textarea");
          textArea.value = url;
          textArea.style.position = "fixed";
          textArea.style.left = "-9999px";
          textArea.style.top = "0";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          try {
              document.execCommand('copy');
              alert(`URL copiada: ${url}`);
          } catch (err) {
              console.error('Fallback copy failed', err);
              alert(`No se pudo copiar automáticamente. URL: ${url}`);
          }
          document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert(`Error al copiar. URL: ${url}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans text-gray-800">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
            <div className="bg-brand-purple text-white p-2 rounded-lg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Ascensus RRHH</h1>
        </div>
        
        <div className="w-full md:w-1/2 bg-white p-2 rounded-lg shadow-sm border border-gray-200 flex flex-col">
           <label className="text-xs text-gray-500 font-semibold px-2">Vía de aprendizaje</label>
           <div className="relative">
             <select 
                className="w-full p-2 bg-transparent font-medium text-gray-900 focus:outline-none appearance-none cursor-pointer"
                value={selectedPathId}
                onChange={(e) => setSelectedPathId(Number(e.target.value))}
             >
                {MOCK_PATHS.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                ))}
             </select>
             <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-gray-400 pointer-events-none"/>
           </div>
        </div>
        
        <button className="bg-brand-purple text-white px-6 py-3 rounded-lg shadow hover:bg-brand-dark transition-colors font-medium">
            Cargar participantes
        </button>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table Section */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Participantes de la vía #{selectedPathId}</h2>
                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium">
                    {users.length} participantes
                </span>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wider">
                            <th className="p-4 font-semibold">Participante</th>
                            <th className="p-4 font-semibold">Avance total</th>
                            <th className="p-4 font-semibold">Última actividad</th>
                            <th className="p-4 font-semibold text-center">Cursos<br/>completados</th>
                            <th className="p-4 font-semibold text-center">Cursos en<br/>progreso</th>
                            <th className="p-4 font-semibold text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {users.map((user) => (
                            <tr key={user.email} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                    <div className="font-semibold text-gray-900">{user.name}</div>
                                    <div className="text-gray-500 text-xs">{user.email}</div>
                                </td>
                                <td className="p-4 w-1/5">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold">{user.stats.totalProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="h-2 rounded-full" 
                                            style={{ 
                                                width: `${user.stats.totalProgress}%`,
                                                background: `linear-gradient(90deg, ${
                                                    user.stats.totalProgress < 30 ? '#ef4444' : 
                                                    user.stats.totalProgress < 70 ? '#eab308' : 
                                                    '#84cc16'
                                                })`
                                            }}
                                        ></div>
                                    </div>
                                </td>
                                <td className="p-4 text-gray-600 font-medium">
                                    {user.stats.lastActivity}
                                </td>
                                <td className="p-4 text-center font-bold text-gray-800">
                                    {user.stats.coursesCompleted}
                                </td>
                                <td className="p-4 text-center font-bold text-gray-800">
                                    {user.stats.coursesInProgress}
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center gap-2">
                                        <button 
                                            onClick={() => handleCopyUrl(user.email)}
                                            className="flex items-center gap-1 px-3 py-1.5 border border-brand-purple text-brand-purple rounded-md hover:bg-brand-light text-xs font-medium transition-colors"
                                            title="Copiar enlace directo"
                                        >
                                            <Copy size={14} /> Copiar URL
                                        </button>
                                        <button 
                                            onClick={() => onSelectUser(user.email)}
                                            className="p-1.5 text-gray-400 hover:text-gray-600"
                                            title="Ver como usuario"
                                        >
                                            <ExternalLink size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500">
                                    No hay usuarios inscritos en esta ruta.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Help Sidebar */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ayuda</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Selecciona una vía para listar los participantes.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Usa <strong>"Copiar URL"</strong> para compartir el enlace directo al panel del alumno.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="text-blue-800 font-semibold text-sm mb-2">API Status</h4>
                <div className="flex items-center gap-2 text-xs text-blue-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Conectado a Udemy
                </div>
            </div>
        </div>
      </main>
      
      <footer className="mt-12 pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
        <p>&copy; 2025 CognosOnline · Ascensus RRHH</p>
        <div className="flex items-center gap-2 mt-2 md:mt-0">
            <span>Estrategias</span>
            <span className="text-red-500">♥</span>
            <span>para motivar el aprendizaje</span>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;
