import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  AlertTriangle, 
  Download, 
  Plus, 
  CalendarDays,
  ArrowRight,
  Clock,
  LayoutDashboard
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:3000/api';

// Interfaces TypeScript propres
interface Student {
  id: number;
  nom: string;
  genre: string;
  date_dernier_expose: string | null;
  status?: string;
}

interface Programme {
  id: number;
  date_debut_semaine: string;
  date_fin_semaine: string;
  contient_discours: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  
  const [priorityStudents, setPriorityStudents] = useState<Student[]>([]);
  const [upcomingWeeks, setUpcomingWeeks] = useState<Programme[]>([]);
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
          .filter((p: Programme) => new Date(p.date_debut_semaine) >= new Date())
          .sort((a: Programme, b: Programme) => new Date(a.date_debut_semaine).getTime() - new Date(b.date_debut_semaine).getTime())
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
    // FOND GLOBAL : Très sobre, avec de légères taches de couleurs floutées pour faire ressortir le verre
    <div className="min-h-screen bg-slate-50 relative overflow-hidden text-slate-800 p-8">
      {/* Formes d'arrière-plan floutées (très subtiles) */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-blue-200/40 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-slate-300/50 blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto animate-in fade-in duration-500 relative z-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2 flex items-center gap-3 text-slate-800">
              <LayoutDashboard className="text-blue-600" size={28} />
              Tableau de bord
            </h1>
            <p className="text-slate-500 font-medium">Vue d'ensemble des attributions et alertes d'exposés.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Bouton secondaire professionnel */}
            <button className="px-5 py-2.5 text-slate-700 font-semibold bg-white/70 hover:bg-white border border-slate-200 backdrop-blur-md rounded-xl transition-all shadow-sm flex items-center gap-2">
              <Download size={18} /> Exporter
            </button>
            {/* Bouton primaire pro */}
            <button 
              onClick={() => navigate('/programmes')}
              className="px-5 py-2.5 text-white font-bold bg-blue-600 hover:bg-blue-700 border border-blue-700 rounded-xl transition-all shadow-sm flex items-center gap-2 active:scale-95"
            >
              <Plus size={20} /> Planifier
            </button>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          
          {/* Card: Total Students - Professional Glass */}
          <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Effectif Global</h3>
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Users size={24} className="text-blue-600" />
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-slate-800">{stats.total}</span>
              <span className="text-sm font-medium text-slate-500">élèves inscrits</span>
            </div>
          </div>

          {/* Card: Alerts - Professional Glass */}
          <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start mb-6 relative z-10">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Alertes Prioritaires</h3>
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                <AlertTriangle size={24} className="text-rose-600" />
              </div>
            </div>
            <div className="flex items-baseline gap-3 relative z-10">
              <span className="text-4xl font-extrabold text-slate-800">{stats.alerts}</span>
              {stats.alerts > 0 && (
                <span className="text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1 rounded-full">
                  Action requise
                </span>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: PRIORITY LIST */}
          <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200/50 flex justify-between items-center bg-white/40">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Élèves en attente d'exposé
              </h2>
              <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                Gérer les élèves <ArrowRight size={16} />
              </button>
            </div>
            
            <div className="overflow-x-auto flex-1 p-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200/50">
                    <th className="p-4 font-bold">Nom</th>
                    <th className="p-4 font-bold">Genre</th>
                    <th className="p-4 font-bold">Dernier passage</th>
                    <th className="p-4 font-bold">Statut</th>
                    <th className="p-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {isLoading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">Chargement des données...</td></tr>
                  ) : priorityStudents.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">Aucun élève prioritaire pour le moment.</td></tr>
                  ) : (
                    priorityStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-white/60 transition-colors group">
                        <td className="p-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs uppercase text-slate-600">
                            {student.nom.substring(0, 2)}
                          </div>
                          <span className="font-semibold text-slate-800">{student.nom}</span>
                        </td>
                        <td className="p-4 text-slate-500">{student.genre}</td>
                        <td className="p-4 text-slate-500">{student.date_dernier_expose || 'Non assigné'}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Prioritaire
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => navigate('/programmes')}
                            className="text-sm text-blue-600 font-semibold hover:text-blue-800 hover:underline"
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

          {/* RIGHT COLUMN: UPCOMING WEEKS */}
          <div className="lg:col-span-1 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-200/50 bg-white/40">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CalendarDays className="text-slate-400" size={20} />
                Prochaines réunions
              </h2>
            </div>
            
            <div className="p-6 flex-1 flex flex-col gap-4">
              {isLoading ? (
                 <div className="text-center text-slate-400 py-4">Recherche des dates...</div>
              ) : upcomingWeeks.length === 0 ? (
                <div className="text-center p-6 bg-white/50 border border-slate-200 border-dashed rounded-xl text-slate-500 flex flex-col items-center gap-2">
                  <Clock size={24} className="text-slate-300" />
                  <p className="text-sm font-medium">Le calendrier est vide.</p>
                </div>
              ) : (
                upcomingWeeks.map((week, index) => (
                  <div 
                    key={week.id} 
                    onClick={() => navigate(`/schedule/${week.id}`)}
                    className="group p-4 rounded-xl border border-slate-200/60 bg-white/40 hover:bg-white hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all relative overflow-hidden"
                  >
                    {index === 0 && (
                      <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                        SEMAINE PROCHAINE
                      </div>
                    )}
                    <h3 className="font-bold text-slate-800 mb-2">
                      Semaine du {new Date(week.date_debut_semaine).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        week.contient_discours 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'bg-slate-100 text-slate-600'
                      }`}>
                        {week.contient_discours ? 'Avec discours' : 'Programme standard'}
                      </span>
                      <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-4 border-t border-slate-200/50 bg-white/40 text-center">
              <button 
                onClick={() => navigate('/programmes')}
                className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Voir le planning complet
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;