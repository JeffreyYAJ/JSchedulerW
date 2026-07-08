import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, Plus, Calendar, ArrowRight, Loader2, Mic, BookOpen,
  Sparkles, Pencil, Trash2,
} from 'lucide-react';
import {
  apiGet, apiPost, apiPut, apiDelete,
  type Programme, programmeHasDiscours, formatLocalDate,
} from '../lib/api';
import ExportMenu from '../components/ExportMenu';

const ProgrammeManagement = () => {
  const navigate = useNavigate();
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProgramme, setEditProgramme] = useState<Programme | null>(null);
  const [deleteProgramme, setDeleteProgramme] = useState<Programme | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    date_debut_semaine: '',
    date_fin_semaine: '',
    contient_discours: false,
  });

  const fetchProgrammes = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<Programme[]>('/programmes');
      setProgrammes(data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProgrammes(); }, []);

  const openCreate = () => {
    setForm({ date_debut_semaine: '', date_fin_semaine: '', contient_discours: false });
    setEditProgramme(null);
    setIsModalOpen(true);
  };

  const openEdit = (prog: Programme, e: React.MouseEvent) => {
    e.stopPropagation();
    setForm({
      date_debut_semaine: prog.date_debut_semaine,
      date_fin_semaine: prog.date_fin_semaine,
      contient_discours: programmeHasDiscours(prog),
    });
    setEditProgramme(prog);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (editProgramme) {
        await apiPut(`/programmes/${editProgramme.id}`, form);
      } else {
        await apiPost('/programmes', form);
      }
      setIsModalOpen(false);
      setEditProgramme(null);
      await fetchProgrammes();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerer = async () => {
    if (!confirm('Générer 8 semaines automatiquement à partir d\'aujourd\'hui ?')) return;
    setIsGenerating(true);
    try {
      await apiPost<{ message: string }>('/programmes/generer', {
        date_debut: formatLocalDate(new Date()),
        nombre_semaines: 8,
      });
      await fetchProgrammes();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur génération');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProgramme) return;
    try {
      await apiDelete(`/programmes/${deleteProgramme.id}`);
      setDeleteProgramme(null);
      await fetchProgrammes();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur suppression');
    }
  };

  const handleExport = (message: string) => setErrorMsg(message);

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-hidden font-sans text-slate-800">
      <main className="flex-1 p-8 relative z-10 w-full max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/80 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <CalendarDays className="text-blue-600" size={28} /> Semaines & Programmes
            </h1>
            <p className="text-slate-500 mt-1">Gérez les semaines d'assemblée et planifiez les exposés.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExportMenu onError={handleExport} />
            <button onClick={handleGenerer} disabled={isGenerating}
              className="px-4 py-2.5 border border-indigo-200 text-indigo-700 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-50 disabled:opacity-50">
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles size={18} />}
              Générer 8 sem.
            </button>
            <button onClick={openCreate}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700">
              <Plus size={20} /> Nouvelle semaine
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">{errorMsg}</div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programmes.map((prog) => (
              <div key={prog.id}
                onClick={() => navigate(`/schedule/${prog.id}`)}
                className="bg-white/60 backdrop-blur-xl border border-white/80 p-6 rounded-2xl hover:border-blue-200 cursor-pointer transition-all group flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-white border rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white">
                    <Calendar size={24} />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={(e) => openEdit(prog, e)} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg">
                      <Pencil size={16} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteProgramme(prog); }}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-extrabold mb-1">
                  Semaine du {new Date(prog.date_debut_semaine).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Au {new Date(prog.date_fin_semaine).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-200/50">
                  {programmeHasDiscours(prog) ? (
                    <span className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md text-xs font-bold">
                      <Mic size={14} /> Discours
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md text-xs font-bold">
                      <BookOpen size={14} /> Standard
                    </span>
                  )}
                  <ArrowRight className="text-slate-300 group-hover:text-blue-600" size={20} />
                </div>
              </div>
            ))}
            {programmes.length === 0 && (
              <div className="col-span-full text-center py-16 text-slate-500 border-2 border-dashed rounded-2xl">
                Aucune semaine programmée.
              </div>
            )}
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-6">{editProgramme ? 'Modifier la semaine' : 'Créer une semaine'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Date de début</label>
                  <input type="date" required value={form.date_debut_semaine}
                    onChange={(e) => setForm({ ...form, date_debut_semaine: e.target.value })}
                    className="w-full p-2.5 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Date de fin</label>
                  <input type="date" required value={form.date_fin_semaine}
                    onChange={(e) => setForm({ ...form, date_fin_semaine: e.target.value })}
                    className="w-full p-2.5 border rounded-xl" />
                </div>
              </div>
              <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer">
                <input type="checkbox" checked={form.contient_discours}
                  onChange={(e) => setForm({ ...form, contient_discours: e.target.checked })} />
                <span className="text-sm font-medium">Semaine avec discours</span>
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditProgramme(null); }}
                  className="px-5 py-2.5 border rounded-xl font-bold">Annuler</button>
                <button type="submit" disabled={isSubmitting}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold disabled:opacity-50">
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteProgramme && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 text-center shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Supprimer cette semaine ?</h3>
            <p className="text-slate-500 mb-6 text-sm">Les affectations associées seront supprimées.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteProgramme(null)} className="flex-1 py-2.5 border rounded-xl font-bold">Annuler</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-bold">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgrammeManagement;
export type { Programme };
