import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, X, AlertTriangle, BellRing, Clock, CheckCircle2, User, Loader2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3000/api/eleves';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  // État pour le formulaire d'ajout
  const [newStudent, setNewStudent] = useState({ nom: '', genre: '', date_dernier_expose: '' });

  // --------------------------------------------------------
  // 1. LOGIQUE DE CALCUL DU STATUT (Règle des 3 mois)
  // --------------------------------------------------------
  const calculateStatus = (dateString) => {
    if (!dateString) return 'OK';
    const lastDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays > 90) return 'Overdue'; // Plus de 3 mois
    if (diffDays > 60) return 'Upcoming'; // Attention, on s'approche
    return 'OK';
  };

  // --------------------------------------------------------
  // 2. APPELS API (GET, POST, DELETE)
  // --------------------------------------------------------
  
  // GET : Récupérer tous les élèves
  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error('Erreur réseau');
      
      const data = await response.json();
      
      // On enrichit les données de l'API avec notre calcul de statut
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

  // On charge les données au premier rendu du composant
  useEffect(() => {
    fetchStudents();
  }, []);

  // DELETE : Supprimer un élève
  const handleDelete = async () => {
    if (!showDeleteModal) return;
    try {
      const response = await fetch(`${API_BASE_URL}/${showDeleteModal.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Mise à jour de l'UI sans recharger la page
        setStudents(students.filter(s => s.id !== showDeleteModal.id));
        setShowDeleteModal(null);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  // POST : Ajouter un élève (J'utilise POST pour la création, mais on peut ajuster si ton API attend un PUT pour la création)
  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      // Si la date est vide, on met la date du jour par défaut
      const dateToSend = newStudent.date_dernier_expose || new Date().toISOString().split('T')[0];
      
      const response = await fetch(API_BASE_URL, {
        method: 'POST', // Remplace par 'PUT' si ton endpoint de création est strictement un PUT
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
        // On recharge la liste pour avoir le bon ID généré par le backend
        fetchStudents(); 
        setShowAddModal(false);
        setNewStudent({ nom: '', genre: '', date_dernier_expose: '' }); // Reset du form
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
    }
  };

  // --------------------------------------------------------
  // 3. COMPOSANTS VISUELS
  // --------------------------------------------------------
  const StatusBadge = ({ status }) => {
    switch (status) {
      case 'Overdue':
        return (
          <span className="flex items-center gap-1.5 w-max bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm animate-pulse">
            <AlertTriangle size={14} /> 3+ Mois
          </span>
        );
      case 'Upcoming':
        return (
          <span className="flex items-center gap-1.5 w-max bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
            <Clock size={14} /> Bientôt
          </span>
        );
      case 'OK':
      default:
        return (
          <span className="flex items-center gap-1.5 w-max bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
            <CheckCircle2 size={14} /> À jour
          </span>
        );
    }
  };

  const overdueCount = students.filter(s => s.status === 'Overdue').length;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar (Simplifiée pour l'exemple) */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <User className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
            EduScheduler
          </h1>
        </div>

        <nav className="space-y-2 mt-4">
          <button className="w-full flex items-center gap-3 text-slate-500 font-medium p-3 rounded-lg hover:bg-slate-50 transition-colors">
            Dashboard
          </button>
          <button className="w-full flex items-center gap-3 bg-blue-50 text-blue-700 p-3 rounded-lg font-bold shadow-sm border border-blue-100">
            Students
          </button>
          <button className="w-full flex items-center justify-between text-slate-500 font-medium p-3 rounded-lg hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-3">Alerts</div>
            {overdueCount > 0 && (
              <div className="flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold shadow-md animate-bounce group-hover:animate-none">
                {overdueCount}
              </div>
            )}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-end mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Student Management</h2>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              Gérez les profils et surveillez les retards d'exposés.
            </p>
          </div>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all font-semibold"
          >
            <Plus size={20} /> Add Student
          </button>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
               <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
               <p className="text-slate-500 font-medium">Chargement des élèves...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Genre</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Dernier Exposé</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="group hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-5 text-slate-400 text-sm font-medium">#{student.id}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-transform group-hover:scale-110
                          ${student.genre === 'F' ? 'bg-pink-100 text-pink-600' : 'bg-cyan-100 text-cyan-600'}`}>
                          {student.nom.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-700 group-hover:text-blue-700">{student.nom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-slate-500 font-medium px-2 py-1 bg-slate-100 rounded-md text-sm">
                        {student.genre}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-600 font-medium">
                       {student.date_dernier_expose}
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={student.status} />
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => setShowDeleteModal(student)}
                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all hover:scale-110"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* MODAL: ADD STUDENT */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Ajouter un élève</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:bg-slate-100 p-1 rounded-md transition-colors"><X /></button>
            </div>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nom complet</label>
                <input 
                  type="text" 
                  required
                  value={newStudent.nom}
                  onChange={(e) => setNewStudent({...newStudent, nom: e.target.value})}
                  placeholder="Ex: Marcel" 
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Genre</label>
                <select 
                  required
                  value={newStudent.genre}
                  onChange={(e) => setNewStudent({...newStudent, genre: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="" disabled>Sélectionner le genre</option>
                  <option value="H">Homme (H)</option>
                  <option value="F">Femme (F)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Date du dernier exposé (Optionnel)</label>
                <input 
                  type="date" 
                  value={newStudent.date_dernier_expose}
                  onChange={(e) => setNewStudent({...newStudent, date_dernier_expose: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                />
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md shadow-blue-500/30 transition-all active:scale-95">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Supprimer l'élève</h3>
            <p className="text-slate-500 mb-6 text-sm leading-relaxed">Êtes-vous sûr de vouloir retirer cet élève du système ? Cette action est irréversible.</p>
            <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-center gap-3 mb-8 border border-slate-100">
               <div className="w-8 h-8 bg-white shadow-sm rounded-full flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200">
                {showDeleteModal.nom.substring(0, 2).toUpperCase()}
              </div>
              <span className="font-bold text-slate-700">{showDeleteModal.nom}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">Annuler</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-md shadow-red-500/30 transition-all active:scale-95">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;