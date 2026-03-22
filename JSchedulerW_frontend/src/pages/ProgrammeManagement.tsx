import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Plus, Calendar, ArrowRight, Loader2, Mic, BookOpen } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3000/api';

export interface Programme {
  id: number;
  date_debut_semaine: string;
  date_fin_semaine: string;
  contient_discours: boolean;
}

const ProgrammeManagement = () => {
  const navigate = useNavigate();
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Formulaire pour une nouvelle semaine
  const [newProgramme, setNewProgramme] = useState({
    date_debut_semaine: '',
    date_fin_semaine: '',
    contient_discours: false
  });

  const fetchProgrammes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/programmes`); 
      if (!response.ok) throw new Error('Erreur réseau');
      const data: Programme[] = await response.json();
      setProgrammes(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des programmes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Récupérer les semaines existantes
  useEffect(() => {
    fetchProgrammes();
  }, []);

  // Typage strict de l'événement du formulaire
  const handleCreateProgramme = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/programmes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProgramme)
      });

      if (response.ok) {
        await fetchProgrammes(); 
        setIsModalOpen(false); 
        setNewProgramme({ date_debut_semaine: '', date_fin_semaine: '', contient_discours: false }); // Reset
      } else {
        alert("Erreur lors de la création de la semaine.");
      }
    } catch (error) {
      console.error("Erreur POST:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // FOND GLOBAL : Cohérent avec le reste de l'application
    <div className="flex min-h-screen bg-slate-50 relative overflow-hidden font-sans text-slate-800">
      
      {/* Formes d'arrière-plan floutées */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-blue-200/40 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-slate-300/50 blur-[100px] pointer-events-none"></div>

      <main className="flex-1 p-8 overflow-y-auto relative z-10 w-full max-w-7xl mx-auto animate-in fade-in duration-500">
        
        {/* HEADER - Glassmorphism */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-white/80 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
              <CalendarDays className="text-blue-600" size={28} />
              Semaines & Programmes
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Gérez les semaines d'assemblée et planifiez les exposés.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm active:scale-95 whitespace-nowrap"
          >
            <Plus size={20} /> Nouvelle Semaine
          </button>
        </div>

        {/* LISTE DES SEMAINES */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-slate-500 font-medium">Chargement du calendrier...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programmes.map((prog) => (
              <div 
                key={prog.id} 
                onClick={() => navigate(`/schedule/${prog.id}`)} 
                className="bg-white/60 backdrop-blur-xl border border-white/80 p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:bg-white/80 hover:border-blue-200 hover:shadow-md cursor-pointer transition-all group relative flex flex-col"
              >
                <div className="w-12 h-12 bg-white border border-slate-100 shadow-sm text-blue-600 rounded-xl flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Calendar size={24} />
                </div>
                
                <h3 className="text-lg font-extrabold text-slate-800 mb-1">
                  Semaine du {new Date(prog.date_debut_semaine).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                </h3>
                <p className="text-sm font-medium text-slate-500 mb-6">
                  Au {new Date(prog.date_fin_semaine).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-200/50">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    {prog.contient_discours ? (
                      <span className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md">
                        <Mic size={14} /> Discours prévu
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md">
                        <BookOpen size={14} /> Programme standard
                      </span>
                    )}
                  </div>
                  <ArrowRight className="text-slate-300 group-hover:text-blue-600 transition-colors" size={20} />
                </div>
              </div>
            ))}
            
            {programmes.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white/40 backdrop-blur-sm rounded-2xl border-2 border-dashed border-slate-200/60 text-slate-500 gap-3">
                <CalendarDays size={32} className="text-slate-300" />
                <p className="font-medium">Aucune semaine programmée.</p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="text-sm text-blue-600 font-bold hover:underline"
                >
                  Créer votre première semaine
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODALE DE CRÉATION (Frosted Glass) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white/90 backdrop-blur-xl border border-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-6 border-b border-slate-200/50 bg-white/40 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Plus size={18} strokeWidth={3}/>
                </div>
                Créer une semaine
              </h2>
            </div>

            <form onSubmit={handleCreateProgramme} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Date de début</label>
                  <input 
                    type="date" 
                    required
                    className="w-full p-2.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                    value={newProgramme.date_debut_semaine}
                    onChange={(e) => setNewProgramme({...newProgramme, date_debut_semaine: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Date de fin</label>
                  <input 
                    type="date" 
                    required
                    className="w-full p-2.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                    value={newProgramme.date_fin_semaine}
                    onChange={(e) => setNewProgramme({...newProgramme, date_fin_semaine: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white/50 rounded-xl border border-slate-200 transition-colors hover:bg-white/80">
                <div className="flex items-center h-5 mt-0.5">
                  <input 
                    type="checkbox" 
                    id="discours-toggle"
                    className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500/20 transition-all cursor-pointer"
                    checked={newProgramme.contient_discours}
                    onChange={(e) => setNewProgramme({...newProgramme, contient_discours: e.target.checked})}
                  />
                </div>
                <label htmlFor="discours-toggle" className="text-sm font-medium text-slate-700 cursor-pointer leading-tight">
                  <span className="block font-bold mb-0.5 text-slate-800">Semaine spéciale</span>
                  Cochez cette case si la semaine inclut un discours (remplace le cours biblique standard).
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enregistrer la semaine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgrammeManagement;