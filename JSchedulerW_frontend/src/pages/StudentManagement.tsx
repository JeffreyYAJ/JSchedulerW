import { useState, useEffect } from 'react';
import {
  Plus, Trash2, X, AlertTriangle, Clock, CheckCircle2, Loader2, Users, Pencil, History,
} from 'lucide-react';
import {
  apiGet, apiPost, apiPut, apiDelete,
  type Student, type HistoriqueEntry,
} from '../lib/api';
import { exportStudentsCsv } from '../lib/export';

const calculateStatus = (dateString: string | null): string => {
  if (!dateString) return 'Overdue';
  const diffDays = Math.ceil(
    Math.abs(Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays > 90) return 'Overdue';
  if (diffDays > 60) return 'Upcoming';
  return 'OK';
};

const StatusBadge = ({ status }: { status?: string }) => {
  switch (status) {
    case 'Overdue':
      return (
        <span className="flex items-center gap-1.5 w-max bg-rose-50 text-rose-600 border border-rose-100 px-2.5 py-1 rounded-md text-xs font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          3+ Mois
        </span>
      );
    case 'Upcoming':
      return (
        <span className="flex items-center gap-1.5 w-max bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1 rounded-md text-xs font-bold">
          <Clock size={14} /> Bientôt
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1.5 w-max bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-md text-xs font-bold">
          <CheckCircle2 size={14} /> À jour
        </span>
      );
  }
};

const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Student | null>(null);
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
  const [historique, setHistorique] = useState<HistoriqueEntry[]>([]);
  const [form, setForm] = useState({ nom: '', genre: '', date_dernier_expose: '' });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet<Student[]>('/eleves');
      setStudents(data.map((s) => ({ ...s, status: calculateStatus(s.date_dernier_expose) })));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const openAdd = () => {
    setForm({ nom: '', genre: '', date_dernier_expose: '' });
    setShowAddModal(true);
    setErrorMsg(null);
  };

  const openEdit = (student: Student) => {
    setForm({
      nom: student.nom,
      genre: student.genre,
      date_dernier_expose: student.date_dernier_expose || '',
    });
    setEditStudent(student);
    setErrorMsg(null);
  };

  const openHistory = async (student: Student) => {
    setHistoryStudent(student);
    try {
      const data = await apiGet<HistoriqueEntry[]>(`/eleves/${student.id}/historique`);
      setHistorique(data);
    } catch {
      setHistorique([]);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPost('/eleves', {
        nom: form.nom,
        genre: form.genre,
        date_dernier_expose: form.date_dernier_expose || null,
      });
      setShowAddModal(false);
      await fetchStudents();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;
    try {
      await apiPut(`/eleves/${editStudent.id}`, {
        nom: form.nom,
        genre: form.genre,
        date_dernier_expose: form.date_dernier_expose || null,
      });
      setEditStudent(null);
      await fetchStudents();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleDelete = async () => {
    if (!showDeleteModal) return;
    try {
      await apiDelete(`/eleves/${showDeleteModal.id}`);
      setShowDeleteModal(null);
      await fetchStudents();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const FormFields = () => (
    <>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1.5">Nom complet</label>
        <input type="text" required value={form.nom}
          onChange={(e) => setForm({ ...form, nom: e.target.value })}
          className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1.5">Genre</label>
        <select required value={form.genre}
          onChange={(e) => setForm({ ...form, genre: e.target.value })}
          className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500">
          <option value="" disabled>Sélectionner</option>
          <option value="H">Homme (H)</option>
          <option value="F">Femme (F)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1.5">Date du dernier exposé (optionnel)</label>
        <input type="date" value={form.date_dernier_expose}
          onChange={(e) => setForm({ ...form, date_dernier_expose: e.target.value })}
          className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-hidden font-sans text-slate-800">
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-blue-200/40 blur-[100px] pointer-events-none" />
      <main className="flex-1 p-8 relative z-10 w-full max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/80">
          <div>
            <h2 className="text-3xl font-extrabold flex items-center gap-3">
              <Users className="text-blue-600" size={28} /> Gestion des Élèves
            </h2>
            <p className="text-slate-500 mt-1">Gérez les profils et surveillez les retards d'exposés.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => exportStudentsCsv(students)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl font-semibold hover:bg-white">
              Exporter CSV
            </button>
            <button onClick={openAdd}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:bg-blue-700">
              <Plus size={20} /> Ajouter
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">{errorMsg}</div>
        )}

        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/80 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-white/40 border-b border-slate-200/50">
                <tr className="text-xs uppercase text-slate-500">
                  <th className="px-6 py-4">Élève</th>
                  <th className="px-6 py-4">Genre</th>
                  <th className="px-6 py-4">Dernier exposé</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-white/80">
                    <td className="px-6 py-4 font-bold">{student.nom}</td>
                    <td className="px-6 py-4">{student.genre}</td>
                    <td className="px-6 py-4">{student.date_dernier_expose || 'Aucun'}</td>
                    <td className="px-6 py-4"><StatusBadge status={student.status} /></td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button onClick={() => openHistory(student)} className="p-2 text-slate-400 hover:text-indigo-600" title="Historique">
                        <History size={18} />
                      </button>
                      <button onClick={() => openEdit(student)} className="p-2 text-slate-400 hover:text-blue-600" title="Modifier">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => setShowDeleteModal(student)} className="p-2 text-slate-400 hover:text-red-600" title="Supprimer">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {(showAddModal || editStudent) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{editStudent ? 'Modifier l\'élève' : 'Ajouter un élève'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditStudent(null); }}><X size={20} /></button>
            </div>
            <form onSubmit={editStudent ? handleEdit : handleAdd} className="space-y-4">
              <FormFields />
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => { setShowAddModal(false); setEditStudent(null); }}
                  className="flex-1 py-2.5 border rounded-xl font-bold">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 text-center shadow-2xl">
            <AlertTriangle size={28} className="mx-auto text-rose-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Supprimer {showDeleteModal.nom} ?</h3>
            <p className="text-slate-500 mb-6 text-sm">Ses affectations seront aussi supprimées.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(null)} className="flex-1 py-2.5 border rounded-xl font-bold">Annuler</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-bold">Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {historyStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Historique — {historyStudent.nom}</h3>
              <button onClick={() => setHistoryStudent(null)}><X size={20} /></button>
            </div>
            {historique.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Aucun exposé enregistré.</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="text-xs uppercase text-slate-400 border-b">
                  <th className="py-2 text-left">Semaine</th><th className="py-2 text-left">Exposé</th><th className="py-2 text-left">Rôle</th>
                </tr></thead>
                <tbody className="divide-y">
                  {historique.map((h) => (
                    <tr key={h.affectation_id}>
                      <td className="py-2">{h.date_debut_semaine}</td>
                      <td className="py-2">{h.type_expose}</td>
                      <td className="py-2">{h.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
export type { Student };
