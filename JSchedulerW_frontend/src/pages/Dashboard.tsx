import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Presentation, 
  AlertTriangle, 
  Download, 
  Plus, 
  CalendarDays,
  ArrowRight,
  Clock
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:3000/api';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // États pour stocker les données
  const [priorityStudents, setPriorityStudents] = useState([]);
  const [upcomingWeeks, setUpcomingWeeks] = useState([]);
  const [stats, setStats] = useState({ total: 0, alerts: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [prioRes, progRes, allStudentsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/eleves/prioritaires`),
          fetch(`${API_BASE_URL}/programmes`),
          fetch(`${API_BASE_URL}/eleves`)
        ]);

        const prioData = await prioRes.json();
        const progData = await progRes.json();
        const allStudentsData = await allStudentsRes.json();

        setPriorityStudents(prioData.slice(0, 5)); 
        
        const sortedProgs = progData
          .filter(p => new Date(p.date_debut_semaine) >= new Date()) // Uniquement le futur/présent
          .sort((a, b) => new Date(a.date_debut_semaine) - new Date(b.date_debut_semaine))
          .slice(0, 3);
        setUpcomingWeeks(sortedProgs);

    
        setStats({
          total: allStudentsData.length, 
          alerts: prioData.length 
        });

      } catch (error) {
        console.error("Erreur lors du chargement du dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-1">Tableau de bord</h1>
          <p className="text-slate-500">Surveillez la progression des exposés et les alertes.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 text-slate-600 font-semibold bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all shadow-sm flex items-center gap-2">
            <Download size={18} /> Exporter
          </button>
          <button 
            onClick={() => navigate('/programmes')}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/30 flex items-center gap-2 active:scale-95"
          >
            <Plus size={20} /> Planifier
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Students */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Élèves</h3>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-slate-800">{stats.total}</span>
            {/* <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center">
              ↗ 5%
            </span> */}
          </div>
        </div>

        {/* Presentations This Month */}
        {/* <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Exposés ce mois</h3>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Presentation size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-slate-800">45</span>
            <span className="text-sm font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center">
              → 0%
            </span>
          </div>
        </div> */}

        {/* Alerts */}
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -z-10"></div>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Alertes Critiques</h3>
            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-slate-800">{stats.alerts}</span>
            <span className="text-sm font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md flex items-center gap-1">
               {Math.min(3, stats.alerts)} nouveau(x)
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: PRIORITY LIST & UPCOMING WEEKS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: PRIORITY LIST (Prend 2 colonnes sur 3) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
            <h2 className="text-lg font-bold text-slate-800">Liste de Priorité - Retards</h2>
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              Voir tout <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4 font-bold">Élève</th>
                  <th className="p-4 font-bold">Genre</th>
                  <th className="p-4 font-bold">Dernier Exposé</th>
                  <th className="p-4 font-bold">Statut</th>
                  <th className="p-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoading ? (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-400">Chargement...</td></tr>
                ) : priorityStudents.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-400">Aucun élève en retard. Bravo !</td></tr>
                ) : (
                  priorityStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs uppercase">
                          {student.nom.substring(0, 2)}
                        </div>
                        <span className="font-bold text-slate-800">{student.nom}</span>
                      </td>
                      <td className="p-4 text-slate-600">{student.genre}</td>
                      <td className="p-4 text-slate-600">{student.date_dernier_expose || 'Jamais'}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                          En retard
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => navigate('/programmes')}
                          className="text-blue-600 font-bold hover:text-blue-800 hover:underline"
                        >
                          Assigner
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: UPCOMING WEEKS (Prend 1 colonne sur 3) */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CalendarDays className="text-blue-600" size={20} /> 
              Prochaines Semaines
            </h2>
            <p className="text-xs text-slate-500 mt-1">Aperçu des 3 prochaines sessions</p>
          </div>
          
          <div className="p-6 flex-1 flex flex-col gap-4">
            {isLoading ? (
               <div className="text-center text-slate-400 py-4">Chargement...</div>
            ) : upcomingWeeks.length === 0 ? (
              <div className="text-center p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 flex flex-col items-center gap-2">
                <Clock size={24} className="text-slate-400" />
                <p className="text-sm font-medium">Aucun programme futur.</p>
                <button 
                  onClick={() => navigate('/programmes')}
                  className="mt-2 text-sm text-blue-600 font-bold hover:underline"
                >
                  Créer une semaine
                </button>
              </div>
            ) : (
              upcomingWeeks.map((week, index) => (
                <div 
                  key={week.id} 
                  onClick={() => navigate(`/schedule/${week.id}`)}
                  className="group p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-blue-300 hover:shadow-md cursor-pointer transition-all relative overflow-hidden"
                >
                  {/* Petit badge pour indiquer la semaine la plus proche */}
                  {index === 0 && (
                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                      PROCHAIN
                    </div>
                  )}
                  <h3 className="font-bold text-slate-800 mb-1">
                    Semaine du {new Date(week.date_debut_semaine).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </h3>
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${week.contient_discours ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                      {week.contient_discours ? 'Discours prévu' : 'Sketch 3'}
                    </span>
                    <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-4 border-t border-slate-100 text-center">
            <button 
              onClick={() => navigate('/programmes')}
              className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Gérer le calendrier complet
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;