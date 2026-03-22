import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  X, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  Users
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:3000/api/eleves';

// 1. Interfaces sorties du composant
export interface Student {
  id: number;
  nom: string;
  genre: string;
  date_dernier_expose: string | null;
  status?: string;
}

const StudentManagement = () => {
  // 2. Typage strict des états
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<Student | null>(null);
  const [newStudent, setNewStudent] = useState({ nom: '', genre: '', date_dernier_expose: '' });

  // Calcul du statut avec typage du paramètre
  const calculateStatus = (dateString: string | null): string => {
    if (!dateString) return 'OK';
    const lastDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays > 90) return 'Overdue';
    if (diffDays > 60) return 'Upcoming';
    return 'OK';
  };

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error('Erreur réseau');
      
      const data: Student[] = await response.json();
      
      const enrichedData = data.map(student => ({
        ...student,
        status: calculateStatus(student.date_dernier_expose)
      }));
      
      setStudents(enrichedData);
    } catch (error) {
      console.error("Erreur lors de la récupération des élèves:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDelete = async () => {
    if (!showDeleteModal) return;
    try {
      const response = await fetch(`${API_BASE_URL}/${showDeleteModal.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setStudents(students.filter(s => s.id !== showDeleteModal.id));
        setShowDeleteModal(null);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  // Typage de l'événement du formulaire
  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const dateToSend = newStudent.date_dernier_expose || new Date().toISOString().split('T')[0];
      
      const response = await fetch(API_BASE_URL, {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: newStudent.nom,
          genre: newStudent.genre,
          date_dernier_expose: dateToSend
        }),
      });

      if (response.ok) {
        fetchStudents(); 
        setShowAddModal(false);
        setNewStudent({ nom: '', genre: '', date_dernier_expose: '' });
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
    }
  };

  // Composant interne typé
  const StatusBadge = ({ status }: { status?: string }) => {
    switch (status) {
      case 'Overdue':
        return (
          <span className="flex items-center gap-1.5 w-max bg-rose-50 text-rose-600 border border-rose-100 px-2.5 py-1 rounded-md text-xs font-bold shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            3+ Mois
          </span>
        );
      case 'Upcoming':
        return (
          <span className="flex items-center gap-1.5 w-max bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1 rounded-md text-xs font-bold shadow-sm">
            <Clock size={14} /> Bientôt
          </span>
        );
      case 'OK':
      default:
        return (
          <span className="flex items-center gap-1.5 w-max bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-md text-xs font-bold shadow-sm">
            <CheckCircle2 size={14} /> À jour
          </span>
        );
    }
  };

  return (
    // FOND GLOBAL : Cohérent avec le Dashboard
    <div className="flex min-h-screen bg-slate-50 relative overflow-hidden font-sans text-slate-800">
      
      {/* Formes d'arrière-plan floutées */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-blue-200/40 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-slate-300/50 blur-[100px] pointer-events-none"></div>

      <main className="flex-1 p-8 overflow-y-auto relative z-10 w-full max-w-7xl mx-auto animate-in fade-in duration-500">
        
        {/* HEADER - Glassmorphism */}
        <div className="flex justify-between items-center mb-8 bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-white/80">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
              <Users className="text-blue-600" size={28} />
              Gestion des Élèves
            </h2>
            <p className="text-slate-500 mt-1 font-medium">
              Gérez les profils et surveillez les retards d'exposés.
            </p>
          </div>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all font-bold shadow-sm active:scale-95"
          >
            <Plus size={20} /> Ajouter un élève
          </button>
        </div>

        {/* TABLE CONTAINER - Glassmorphism */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-white/80 overflow-hidden min-h-100">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
               <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
               <p className="text-slate-500 font-medium">Chargement des élèves...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
                <Users size={32} />
              </div>
              <p className="text-slate-500 font-medium">Aucun élève trouvé dans la base de données.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/40 border-b border-slate-200/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Élève</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Genre</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dernier Exposé</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {students.map((student) => (
                    <tr key={student.id} className="group hover:bg-white/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border ${
                            student.genre === 'F' ? 'bg-pink-50 text-pink-600 border-pink-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                            {student.nom.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">{student.nom}</span>
                            <span className="text-xs text-slate-400 font-medium">ID: #{student.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600 font-medium px-2.5 py-1 bg-slate-100/80 border border-slate-200 rounded-md text-sm">
                          {student.genre}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                         {student.date_dernier_expose || 'Aucun'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={student.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setShowDeleteModal(student)}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                          title="Supprimer l'élève"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: ADD STUDENT (Glassmorphism Frosted) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
          <div className="bg-white/90 backdrop-blur-xl border border-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Ajouter un élève</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nom complet</label>
                <input 
                  type="text" 
                  required
                  value={newStudent.nom}
                  onChange={(e) => setNewStudent({...newStudent, nom: e.target.value})}
                  placeholder="Ex: Marcel" 
                  className="w-full p-2.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Genre</label>
                <select 
                  required
                  value={newStudent.genre}
                  onChange={(e) => setNewStudent({...newStudent, genre: e.target.value})}
                  className="w-full p-2.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                >
                  <option value="" disabled>Sélectionner le genre</option>
                  <option value="H">Homme (H)</option>
                  <option value="F">Femme (F)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Date du dernier exposé</label>
                <input 
                  type="date" 
                  value={newStudent.date_dernier_expose}
                  onChange={(e) => setNewStudent({...newStudent, date_dernier_expose: e.target.value})}
                  className="w-full p-2.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-700" 
                />
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-sm transition-all active:scale-95">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
          <div className="bg-white/90 backdrop-blur-xl border border-white rounded-2xl w-full max-w-md p-8 shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Supprimer l'élève</h3>
            <p className="text-slate-500 mb-6 text-sm leading-relaxed font-medium">Êtes-vous sûr de vouloir retirer cet élève du système ? Cette action est irréversible.</p>
            
            <div className="bg-slate-50/80 p-4 rounded-xl flex items-center justify-center gap-3 mb-8 border border-slate-200/60">
               <div className="w-8 h-8 bg-white shadow-sm rounded-full flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200">
                {showDeleteModal.nom.substring(0, 2).toUpperCase()}
              </div>
              <span className="font-bold text-slate-700">{showDeleteModal.nom}</span>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">Annuler</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-sm transition-all active:scale-95">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;