import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, Sparkles, CheckCircle2, Save, Loader2, ArrowLeft, AlertCircle, Pencil, Trash2,
} from 'lucide-react';
import {
  apiGet, apiPost, apiPut, apiDelete,
  type Student, type Programme, type AffectationDetail,
  programmeHasDiscours,
} from '../lib/api';
import ExportMenu from '../components/ExportMenu';
import {
  emptyAssignments, buildSmartSuggestions, assignmentsToPayloads,
  getActiveAssignmentKey, type AssignmentsState, type SlotKey, SLOT_TO_TYPE,
} from '../lib/smartSuggest';

const CreateSession = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const programmeId = parseInt(id || '0', 10);

  const [programme, setProgramme] = useState<Programme | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [priorityIds, setPriorityIds] = useState<Set<number>>(new Set());
  const [existingAffectations, setExistingAffectations] = useState<AffectationDetail[]>([]);
  const [assignments, setAssignments] = useState<AssignmentsState>(emptyAssignments());
  const [activeSlot, setActiveSlot] = useState('lecture');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [editAffectation, setEditAffectation] = useState<AffectationDetail | null>(null);
  const [editStudentId, setEditStudentId] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!programmeId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [prog, allStudents, prioritaires, affectations] = await Promise.all([
        apiGet<Programme>(`/programmes/${programmeId}`),
        apiGet<Student[]>('/eleves'),
        apiGet<Student[]>('/eleves/prioritaires'),
        apiGet<AffectationDetail[]>(`/programmes/${programmeId}/affectations`),
      ]);
      setProgramme(prog);
      setStudents(allStudents);
      setPriorityIds(new Set(prioritaires.map((s) => s.id)));
      setExistingAffectations(affectations);
      setAssignments(emptyAssignments());
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }, [programmeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const assignmentKey: SlotKey = programme
    ? getActiveAssignmentKey(activeSlot, programme)
    : 'lecture';

  const incompleteSlots = ['lecture', 'sketch1', 'sketch2', 'sketch3'].filter((slot) => {
    if (!programme) return false;
    const key = getActiveAssignmentKey(slot, programme);
    const typeExpose = SLOT_TO_TYPE[key];
    const existing = existingAffectations.filter((a) => a.type_expose === typeExpose);
    const needed = key === 'lecture' || key === 'discours' ? 1 : 2;
    const pending = [assignments[key][1], assignments[key][2]].filter(Boolean).length;
    return existing.length + pending < needed;
  });

  const getAvailableStudents = (slotId: number) => {
    let filtered = [...students];

    if (assignmentKey === 'lecture' || assignmentKey === 'discours') {
      filtered = filtered.filter((s) => s.genre === 'H');
    }

    if (slotId === 2) {
      const titulaireId = assignments[assignmentKey][1];
      if (titulaireId) {
        const titulaire = students.find((s) => s.id.toString() === titulaireId);
        if (titulaire) {
          filtered = filtered.filter(
            (s) => s.genre === titulaire.genre && s.id.toString() !== titulaireId
          );
        }
      }
    } else if (slotId === 1) {
      const partenaireId = assignments[assignmentKey][2];
      if (partenaireId) {
        filtered = filtered.filter((s) => s.id.toString() !== partenaireId);
      }
    }

    const selectedInSlot = new Set(
      Object.values(assignments).flatMap((r) => [r[1], r[2]].filter(Boolean))
    );

    filtered = filtered.filter(
      (s) => !selectedInSlot.has(String(s.id)) || assignments[assignmentKey][slotId as 1 | 2] === String(s.id)
    );

    filtered = filtered.filter((s) => !existingAffectations.some((a) => a.eleve_id === s.id));

    return {
      priority: filtered.filter((s) => priorityIds.has(s.id)),
      others: filtered.filter((s) => !priorityIds.has(s.id)),
    };
  };

  const handleSelectChange = (slotId: number, studentId: string) => {
    setAssignments((prev) => ({
      ...prev,
      [assignmentKey]: {
        ...prev[assignmentKey],
        [slotId]: studentId,
      },
    }));
  };

  const handleSaveSession = async () => {
    if (!programme) return;
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payloads = assignmentsToPayloads(programmeId, assignments, programme).filter(
      (p) => !existingAffectations.some(
        (a) => a.eleve_id === p.id_eleve && a.type_expose === p.type_expose
      )
    );

    if (payloads.length === 0) {
      setErrorMsg('Aucune nouvelle affectation à enregistrer.');
      setIsSaving(false);
      return;
    }

    try {
      for (const payload of payloads) {
        await apiPost('/affectations', payload);
      }
      setSuccessMsg(`${payloads.length} affectation(s) enregistrée(s) avec succès !`);
      await loadData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSmartSuggest = () => {
    if (!programme) return;
    const existingIds = new Set(existingAffectations.map((a) => a.eleve_id));
    const suggested = buildSmartSuggestions(students, priorityIds, programme, existingIds);
    setAssignments(suggested);
    setSuccessMsg('Suggestions appliquées — vérifiez puis enregistrez.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const getEligibleStudentsForEdit = (affectation: AffectationDetail) => {
    const assignedElsewhere = new Set(
      existingAffectations
        .filter((a) => a.affectation_id !== affectation.affectation_id)
        .map((a) => a.eleve_id)
    );

    let filtered = students.filter((s) => !assignedElsewhere.has(s.id) || s.id === affectation.eleve_id);

    if (['Lecture', 'Discours'].includes(affectation.type_expose)) {
      filtered = filtered.filter((s) => s.genre === 'H');
    }

    if (affectation.type_expose.startsWith('Sketch')) {
      const partner = existingAffectations.find(
        (a) =>
          a.type_expose === affectation.type_expose &&
          a.affectation_id !== affectation.affectation_id
      );
      if (partner) {
        filtered = filtered.filter((s) => s.genre === partner.genre || s.id === affectation.eleve_id);
      }
    }

    return filtered;
  };

  const openEditModal = (affectation: AffectationDetail) => {
    setEditAffectation(affectation);
    setEditStudentId(String(affectation.eleve_id));
    setErrorMsg(null);
  };

  const handleUpdateAffectation = async () => {
    if (!editAffectation || !editStudentId) return;
    if (editStudentId === String(editAffectation.eleve_id)) {
      setEditAffectation(null);
      return;
    }

    setIsEditing(true);
    setErrorMsg(null);
    try {
      await apiPut(`/affectations/${editAffectation.affectation_id}`, {
        id_eleve: parseInt(editStudentId, 10),
      });
      setSuccessMsg('Affectation modifiée avec succès');
      setEditAffectation(null);
      await loadData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de la modification');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteAffectation = async (affectation: AffectationDetail) => {
    if (!confirm(`Retirer ${affectation.nom} du ${affectation.type_expose} ?`)) return;

    setDeletingId(affectation.affectation_id);
    setErrorMsg(null);
    try {
      await apiDelete(`/affectations/${affectation.affectation_id}`);
      setSuccessMsg('Affectation supprimée');
      await loadData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const getConfigurationSlots = () => {
    switch (activeSlot) {
      case 'lecture':
        return [{ id: 1, label: 'Lecteur', rule: 'Uniquement des hommes' }];
      case 'sketch1':
      case 'sketch2':
        return [
          { id: 1, label: 'Élève 1', rule: 'Sélectionner le premier élève' },
          { id: 2, label: 'Élève 2', rule: "Doit être du même sexe que l'élève 1" },
        ];
      case 'sketch3':
        if (programme && programmeHasDiscours(programme)) {
          return [{ id: 1, label: 'Orateur (Discours)', rule: 'Uniquement des hommes' }];
        }
        return [
          { id: 1, label: 'Élève 1 (Sketch 3)', rule: 'Sélectionner le premier élève' },
          { id: 2, label: 'Élève 2 (Sketch 3)', rule: "Doit être du même sexe que l'élève 1" },
        ];
      default:
        return [];
    }
  };

  const slotsToRender = getConfigurationSlots();
  const slotLabels: Record<string, string> = {
    lecture: 'Lecture',
    sketch1: 'Sketch 1',
    sketch2: 'Sketch 2',
    sketch3: programme && programmeHasDiscours(programme) ? 'Discours' : 'Sketch 3',
  };

  if (!programmeId) {
    return (
      <div className="p-8 text-center text-slate-500">
        Programme invalide. <button onClick={() => navigate('/programmes')} className="text-blue-600 underline">Retour</button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button
        onClick={() => navigate('/programmes')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 font-medium"
      >
        <ArrowLeft size={18} /> Retour aux programmes
      </button>

      <div className="flex justify-between items-end mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
            Ordonnancement
          </h1>
          {programme && (
            <p className="text-slate-500">
              Semaine du {new Date(programme.date_debut_semaine).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              {' — '}
              {programmeHasDiscours(programme) ? 'Avec discours' : 'Programme standard'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu programmeId={programmeId} onError={setErrorMsg} />
          <button
            onClick={handleSmartSuggest}
            disabled={isLoading || !programme}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Sparkles size={18} /> Smart Suggest
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
          {successMsg}
        </div>
      )}

      {existingAffectations.length > 0 && (
        <div className="mb-8 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="font-bold text-slate-800">Planning déjà enregistré</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-400 border-b">
              <tr>
                <th className="p-3 text-left">Exposé</th>
                <th className="p-3 text-left">Rôle</th>
                <th className="p-3 text-left">Élève</th>
                <th className="p-3 text-left">Genre</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {existingAffectations.map((a) => (
                <tr key={a.affectation_id}>
                  <td className="p-3 font-medium">{a.type_expose}</td>
                  <td className="p-3">{a.role}</td>
                  <td className="p-3">{a.nom}</td>
                  <td className="p-3">{a.genre}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEditModal(a)}
                        className="p-2 text-slate-400 hover:text-blue-600 rounded-lg"
                        title="Modifier"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteAffectation(a)}
                        disabled={deletingId === a.affectation_id}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg disabled:opacity-50"
                        title="Supprimer"
                      >
                        {deletingId === a.affectation_id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {incompleteSlots.length > 0 && (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          Créneaux incomplets : {incompleteSlots.map((s) => slotLabels[s]).join(', ')}
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Créneaux à assigner</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['lecture', 'sketch1', 'sketch2', 'sketch3'].map((slot) => (
            <div
              key={slot}
              onClick={() => setActiveSlot(slot)}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative ${
                activeSlot === slot ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-white'
              }`}
            >
              {activeSlot === slot && (
                <CheckCircle2 className="absolute top-4 right-4 text-blue-500" size={20} />
              )}
              <h3 className="font-bold text-slate-800">{slotLabels[slot]}</h3>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-bold text-slate-800 mb-4 capitalize">
          Configuration : {slotLabels[activeSlot]}
        </h2>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-10 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            slotsToRender.map((slot) => {
              const { priority, others } = getAvailableStudents(slot.id);
              return (
                <div
                  key={slot.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-5 border border-slate-200 rounded-2xl bg-white shadow-sm gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400">
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{slot.label}</h4>
                      <p className="text-sm text-slate-500">{slot.rule}</p>
                    </div>
                  </div>
                  <div className="w-full md:w-72">
                    <select
                      className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium text-slate-700 bg-slate-50"
                      value={assignments[assignmentKey][slot.id as 1 | 2]}
                      onChange={(e) => handleSelectChange(slot.id, e.target.value)}
                    >
                      <option value="">-- Assigner un élève --</option>
                      {priority.length > 0 && (
                        <optgroup label="⚠️ Élèves prioritaires">
                          {priority.map((s) => (
                            <option key={`prio-${s.id}`} value={s.id}>
                              {s.nom} ({s.genre}) — {s.date_dernier_expose || 'jamais'}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {others.length > 0 && (
                        <optgroup label="Autres élèves éligibles">
                          {others.map((s) => (
                            <option key={`other-${s.id}`} value={s.id}>
                              {s.nom} ({s.genre})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-slate-200">
        <button
          onClick={handleSaveSession}
          disabled={isSaving || isLoading}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />}
          {isSaving ? 'Enregistrement...' : 'Enregistrer les affectations'}
        </button>
      </div>

      {editAffectation && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-2">Modifier l'affectation</h2>
            <p className="text-sm text-slate-500 mb-4">
              {editAffectation.type_expose} — {editAffectation.role}
            </p>
            <select
              className="w-full p-3 border border-slate-200 rounded-xl mb-6"
              value={editStudentId}
              onChange={(e) => setEditStudentId(e.target.value)}
            >
              {getEligibleStudentsForEdit(editAffectation).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom} ({s.genre})
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditAffectation(null)}
                className="px-5 py-2.5 border rounded-xl font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateAffectation}
                disabled={isEditing}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold disabled:opacity-50"
              >
                {isEditing ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateSession;
