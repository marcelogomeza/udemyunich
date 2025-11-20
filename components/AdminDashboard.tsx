import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MOCK_PATHS } from '../mockData'; // Fallback for initial list
import { Search, Copy, ExternalLink, ChevronDown, RefreshCw } from 'lucide-react';

interface Props {
  onSelectUser: (email: string) => void;
}

const AdminDashboard: React.FC<Props> = ({ onSelectUser }) => {
  const [selectedPathId, setSelectedPathId] = useState<number>(MOCK_PATHS[0].id);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [paths, setPaths] = useState(MOCK_PATHS);

  // Botones de utilería para disparar scripts del backend (uso temporal)
  const handleRunTool = (relativePath: string) => {
    const url = `${window.location.origin}${relativePath}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    const loadPaths = async () => {
      const data = await api.getPaths();
      if (data.length > 0) setPaths(data);
    };
    loadPaths();
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const data = await api.getPathUsers(selectedPathId);
        setUsers(data);
      } catch (error) {
        console.error('Error cargando usuarios:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [selectedPathId]);

  const handleCopyUrl = async (email: string) => {
    // ahora el sitio está en la raíz
    const baseUrl = window.location.origin + "/";
    const url = `${baseUrl}?view=user&email=${email}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        alert(`URL copiada: ${url}`);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert(`URL copiada: ${url}`);
      }
    } catch (err) {
      alert(`Error al copiar. URL: ${url}`);
    }
  };

  const selectedPath = paths.find(p => p.id === selectedPathId) || paths[0];

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans text-gray-800">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-brand-purple text-white p-2 rounded-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                 xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="7" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
              <rect x="14" y="7" width="7" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M5 20h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M14 20h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M7 9h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 10h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Ascensus RRHH</h1>
        </div>

        <div className="w-full md:w-1/2 bg-white p-2 rounded-lg shadow-sm border border-gray-200 flex flex-col">
          <label className="text-xs text-gray-500 font-semibold px-2">Vía de aprendizaje</label>
          <div className="relative">
            <select
              className="w-full p-2 bg-transparent font-medium text-sm text-gray-900 focus:outline-none appearance-none cursor-pointer"
              value={selectedPathId}
              onChange={(e) => setSelectedPathId(Number(e.target.value))}
            >
              {paths.map(path => (
                <option key={path.id} value={path.id}>
                  {path.title}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 bg-brand-purple text-white px-4 py-2 rounded-lg shadow hover:bg-brand-dark transition-colors font-medium"
        >
          <RefreshCw size={18} /> Sincronizar
        </button>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabla de participantes */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">Participantes</h2>
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
                  <th className="p-4 font-semibold text-center">
                    Cursos<br />completados
                  </th>
                  <th className="p-4 font-semibold text-center">
                    Cursos<br />en progreso
                  </th>
                  <th className="p-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      Cargando datos...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No hay participantes en esta vía de aprendizaje.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.email} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-purple to-brand-pink text-white flex items-center justify-center text-xs font-semibold">
                            {user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Search className="w-3 h-3" /> {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${user.stats?.totalProgress >= 80
                                ? 'bg-green-500'
                                : user.stats?.totalProgress >= 40
                                  ? 'bg-yellow-400'
                                  : 'bg-red-400'
                                }`}
                              style={{ width: `${user.stats?.totalProgress || 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {Math.round(user.stats?.totalProgress || 0)}%
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-gray-600 font-medium">
                        {user.stats?.lastActivity || user.lastActivity || '-'}
                      </td>
                      <td className="p-4 text-center font-bold text-gray-800">
                        {user.stats?.coursesCompleted || user.coursesCompleted || 0}
                      </td>
                      <td className="p-4 text-center font-bold text-gray-800">
                        {user.stats?.coursesInProgress || user.coursesInProgress || 0}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleCopyUrl(user.email)}
                            className="flex items-center gap-1 text-xs px-2 py-1 border border-brand-purple text-brand-purple rounded-md hover:bg-brand-light transition"
                          >
                            <Copy className="w-3 h-3" /> Copiar URL
                          </button>
                          <button
                            onClick={() => onSelectUser(user.email)}
                            className="flex items-center gap-1 text-xs px-2 py-1 bg-brand-purple text-white rounded-md hover:bg-brand-dark transition"
                          >
                            <ExternalLink className="w-3 h-3" /> Ver detalle
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Help */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Estado del Sistema</h3>

          <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-4">
            <h4 className="text-green-800 font-semibold text-sm mb-1">Sincronización</h4>
            <p className="text-xs text-green-700">
              La conexión con Udemy Business está configurada. Ejecute <code>sync.php</code> para actualizar datos.
            </p>

            {/* Botones discretos y temporales para utilidades de backend */}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleRunTool('/backend/sync.php')}
                className="px-2 py-1 rounded-full border border-green-300 text-[11px] text-green-800 hover:bg-green-100 transition"
              >
                Ejecutar sync.php
              </button>

              <button
                type="button"
                onClick={() => handleRunTool('/backend/test-db.php')}
                className="px-2 py-1 rounded-full border border-gray-300 text-[11px] text-gray-700 hover:bg-gray-100 transition"
              >
                Probar DB
              </button>

              <button
                type="button"
                onClick={() => handleRunTool('/backend/api.php?action=get_paths')}
                className="px-2 py-1 rounded-full border border-blue-300 text-[11px] text-blue-700 hover:bg-blue-100 transition"
              >
                Ver get_paths
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-400">Cuenta: 403457 (unich)</p>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
