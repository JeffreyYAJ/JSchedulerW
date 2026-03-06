import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Plus, Calendar, ArrowRight, Loader2, Mic } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3000/api';

const ProgrammeManagement = () => {
  const navigate = useNavigate();
  const [programmes, setProgrammes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulaire pour une nouvelle semaine
  const [newProgramme, setNewProgramme] = useState({
    date_debut_semaine: '',
    date_fin_semaine: '',
    contient_discours: false
  });

  // 1. Récupérer les semaines existantes
  useEffect(() => {
    fetchProgrammes();
  }, []);

  const fetchProgrammes = async () => {
    setIsLoading(true);
    try {
      // Assure-toi que cette route existe dans ton backend !
      const response = await fetch(`${API_BASE_URL}/programmes`); 
      const data = await response.json();
      setProgrammes(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des programmes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Créer une nouvelle semaine
  const handleCreateProgramme = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/programmes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProgramme)
      });

      if (response.ok) {
        await fetchProgrammes(); // Recharger la liste
        setIsModalOpen(false); // Fermer la modale
        setNewProgramme({ date_debut: '', date_fin: '', contient_discours: false }); // Reset
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
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">Semaines & Programmes</h1>
          <p className="text-slate-500">Gérez les semaines d'assemblée et planifiez les exposés.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm active:scale-95"
        >
          <Plus size={20} /> Nouvelle Semaine
        </button>
      </div>

      {/* LISTE DES SEMAINES */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programmes.map((prog) => (
            <div 
              key={prog.id} 
              onClick={() => navigate(`/schedule/${prog.id}`)} // Redirection magique avec l'ID !
              className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all group relative"
            >
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <CalendarDays size={24} />
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-1">
            Semaine du {new Date(prog.date_debut_semaine).toLocaleDateString('fr-FR')}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
            Au {new Date(prog.date_fin_semaine).toLocaleDateString('fr-FR')}
            </p>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  {prog.contient_discours ? (
                    <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                      <Mic size={14} /> Contient un discours
                    </span>
                  ) : (
                    <span className="text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                      Classique (Cours biblique)
                    </span>
                  )}
                </div>
                <ArrowRight className="text-slate-400 group-hover:text-blue-600 transition-colors" size={20} />
              </div>
            </div>
          ))}
          
          {programmes.length === 0 && (
            <div className="col-span-full text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500">
              Aucune semaine programmée. Cliquez sur "Nouvelle Semaine" pour commencer.
            </div>
          )}
        </div>
      )}

      {/* MODALE DE CRÉATION */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="text-blue-600" size={24}/> Créer une semaine
              </h2>
            </div>

            <form onSubmit={handleCreateProgramme} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Date de début</label>
                <input 
                type="date" 
                required
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={newProgramme.date_debut_semaine}
                onChange={(e) => setNewProgramme({...newProgramme, date_debut_semaine: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Date de fin</label>
                <input 
                    type="date" 
                    required
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    value={newProgramme.date_fin_semaine}
                    onChange={(e) => setNewProgramme({...newProgramme, date_fin_semaine: e.target.value})}
                    />
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 mt-2">
                <input 
                  type="checkbox" 
                  id="discours-toggle"
                  className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  checked={newProgramme.contient_discours}
                  onChange={(e) => setNewProgramme({...newProgramme, contient_discours: e.target.checked})}
                />
                <label htmlFor="discours-toggle" className="font-medium text-slate-700 cursor-pointer">
                  Cette semaine contient un discours (remplace le cours biblique)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enregistrer"}
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