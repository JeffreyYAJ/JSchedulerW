import React, { useState, useEffect } from 'react';
import { User, Sparkles, BookOpen, Users as UsersIcon, Mic, CheckCircle2, Save, Loader2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3000/api';

const CreateSession = () => {
  const [activeSlot, setActiveSlot] = useState('sketch3'); 
  const [sketch3Type, setSketch3Type] = useState('sketch3'); 
  
  // États pour les données de l'API
  const [students, setStudents] = useState([]);
  const [priorityIds, setPriorityIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // État pour stocker toutes les affectations de la session
  // Format: { lecture: { 1: id_titulaire, 2: id_partenaire }, sketch1: { ... } }
  const [assignments, setAssignments] = useState({
    lecture: { 1: '', 2: '' },
    sketch1: { 1: '', 2: '' },
    sketch2: { 1: '', 2: '' },
    sketch3: { 1: '', 2: '' },
    discours: { 1: '', 2: '' }
  });

  // 1. CHARGEMENT DES DONNÉES (GET)
  useEffect(() => {
    const fetchStudentsData = async () => {
      setIsLoading(true);
      try {
        // On récupère TOUS les élèves et les élèves PRIORITAIRES en parallèle
        const [allRes, prioRes] = await Promise.all([
          fetch(`${API_BASE_URL}/eleves`),
          fetch(`${API_BASE_URL}/eleves/prioritaires`)
        ]);

        const allStudents = await allRes.json();
        const prioStudents = await prioRes.json();

        setStudents(allStudents);
        // On stocke les IDs des élèves prioritaires dans un Set pour une recherche rapide
        setPriorityIds(new Set(prioStudents.map(s => s.id)));
      } catch (error) {
        console.error("Erreur lors de la récupération des élèves:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentsData();
  }, []);

  // Clé actuelle pour accéder au bon objet d'affectation
  const currentAssignmentKey = activeSlot === 'sketch3' && sketch3Type === 'discours' ? 'discours' : activeSlot;

  // 2. LOGIQUE DE FILTRAGE INTELLIGENT
  const getAvailableStudents = (slotId) => {
    let filtered = [...students];

    // Règle A : Lecture et Discours = Uniquement des Hommes
    if (currentAssignmentKey === 'lecture' || currentAssignmentKey === 'discours') {
      filtered = filtered.filter(s => s.genre === 'H');
    }

    // Règle B : Pour les Sketchs (H-H ou F-F)
    if (slotId === 2) {
      // Si on choisit l'élève 2, il doit être du MÊME genre que l'élève 1
      const titulaireId = assignments[currentAssignmentKey][1];
      if (titulaireId) {
        const titulaire = students.find(s => s.id.toString() === titulaireId.toString());
        if (titulaire) {
          filtered = filtered.filter(s => s.genre === titulaire.genre && s.id.toString() !== titulaireId.toString());
        }
      }
    } else if (slotId === 1) {
      // On empêche de sélectionner l'élève 2 comme élève 1
      const partenaireId = assignments[currentAssignmentKey][2];
      if (partenaireId) {
        filtered = filtered.filter(s => s.id.toString() !== partenaireId.toString());
      }
    }

    // On sépare en deux groupes pour l'affichage (Prioritaires vs Autres)
    const priority = filtered.filter(s => priorityIds.has(s.id));
    const others = filtered.filter(s => !priorityIds.has(s.id));

    return { priority, others };
  };

  const handleSelectChange = (slotId, studentId) => {
    setAssignments(prev => ({
      ...prev,
      [currentAssignmentKey]: {
        ...prev[currentAssignmentKey],
        [slotId]: studentId
      }
    }));
  };

  const handleSaveSession = async () => {
    setIsSaving(true);
    const id_programme = 1; 
    const payloadPromises = [];

    // On parcourt nos affectations pour créer les requêtes POST
    for (const [exposeKey, roles] of Object.entries(assignments)) {
      if (!roles[1] && !roles[2]) continue; // Si rien n'est rempli, on passe

      // Formatage du nom pour l'API (ex: "sketch1" -> "Sketch 1", "lecture" -> "Lecture")
      let mappedType = exposeKey.replace('sketch', 'Sketch ');
      mappedType = mappedType.charAt(0).toUpperCase() + mappedType.slice(1);

      // Création de la requête pour le Titulaire (Élève 1)
      if (roles[1]) {
        payloadPromises.push(
          fetch(`${API_BASE_URL}/affectations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_programme, id_eleve: parseInt(roles[1]), type_expose: mappedType, role: 'Titulaire' })
          })
        );
      }

      // Création de la requête pour le Partenaire (Élève 2)
      if (roles[2]) {
        payloadPromises.push(
          fetch(`${API_BASE_URL}/affectations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_programme, id_eleve: parseInt(roles[2]), type_expose: mappedType, role: 'Partenaire' })
          })
        );
      }
    }

    try {
      await Promise.all(payloadPromises);
      alert('Session sauvegardée avec succès ! 🎉');
      // Optionnel : tu pourrais vider les états ici ou rediriger
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Une erreur s'est produite lors de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  };

  // Configuration de l'interface par défaut
  const getConfigurationSlots = () => {
    switch (activeSlot) {
      case 'lecture': return [{ id: 1, label: 'Lecteur', rule: 'Uniquement des hommes' }];
      case 'sketch1':
      case 'sketch2': return [
          { id: 1, label: 'Élève 1', rule: 'Sélectionner le premier élève' },
          { id: 2, label: 'Élève 2', rule: "Doit être du même sexe que l'élève 1" }
        ];
      case 'sketch3':
        if (sketch3Type === 'discours') return [{ id: 1, label: 'Orateur (Discours)', rule: 'Uniquement des hommes' }];
        return [
          { id: 1, label: 'Élève 1 (Sketch 3)', rule: 'Sélectionner le premier élève' },
          { id: 2, label: 'Élève 2 (Sketch 3)', rule: "Doit être du même sexe que l'élève 1" }
        ];
      default: return [];
    }
  };

  const slotsToRender = getConfigurationSlots();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-10 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">Create New Session</h1>
          <p className="text-slate-500">Planifiez les exposés et assignez les élèves éligibles aux créneaux.</p>
        </div>
        <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm active:scale-95">
          <Sparkles size={18} /> Smart Suggest
        </button>
      </div>

      {/* SÉLECTION DU CRÉNEAU */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Session Setup</h2>
        <p className="text-slate-500 mb-6 text-sm">Cliquez sur un créneau pour y assigner des élèves.</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Cartes (Lecture, Sketch 1, 2, 3) - Simplifiées ici pour la lisibilité, garde tes div avec icônes de la version précédente */}
          {['lecture', 'sketch1', 'sketch2', 'sketch3'].map(slot => (
             <div key={slot} onClick={() => setActiveSlot(slot)} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative ${activeSlot === slot ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-white'}`}>
                {activeSlot === slot && <CheckCircle2 className="absolute top-4 right-4 text-blue-500 animate-in zoom-in" size={20} />}
                <h3 className="font-bold text-slate-800 mb-1 capitalize">{slot.replace('sketch', 'Sketch ')}</h3>
             </div>
          ))}
        </div>
      </div>

      {/* CONFIGURATION ET ASSIGNATION */}
      <div key={currentAssignmentKey} className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800 capitalize">
            Configuration : {currentAssignmentKey.replace('sketch', 'Sketch ')}
          </h2>
          {activeSlot === 'sketch3' && (
            <div className="flex bg-slate-200/50 p-1.5 rounded-xl border border-slate-200">
              <button onClick={() => setSketch3Type('sketch3')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${sketch3Type === 'sketch3' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>Sketch 3</button>
              <button onClick={() => setSketch3Type('discours')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${sketch3Type === 'discours' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>Discours</button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-10 bg-white rounded-2xl border border-slate-200">
               <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            slotsToRender.map((slot) => {
              const { priority, others } = getAvailableStudents(slot.id);
              
              return (
                <div key={slot.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 border border-slate-200 rounded-2xl bg-white shadow-sm gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400">
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{slot.label}</h4>
                      <p className="text-sm text-slate-500">{slot.rule}</p>
                    </div>
                  </div>
                  
                  {/* LE MENU DÉROULANT (SELECT) */}
                  <div className="w-full md:w-72">
                    <select 
                      className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 bg-slate-50 cursor-pointer"
                      value={assignments[currentAssignmentKey][slot.id]}
                      onChange={(e) => handleSelectChange(slot.id, e.target.value)}
                    >
                      <option value="">-- Assigner un élève --</option>
                      
                      {/* Groupe des élèves prioritaires */}
                      {priority.length > 0 && (
                        <optgroup label="⚠️ Élèves Prioritaires (Retard)" className="text-red-500 font-bold">
                          {priority.map(s => (
                            <option key={`prio-${s.id}`} value={s.id} className="text-slate-800">
                              {s.nom} ({s.genre}) - {s.date_dernier_expose}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      
                      {/* Groupe des autres élèves */}
                      {others.length > 0 && (
                        <optgroup label="Autres élèves éligibles" className="text-slate-500 font-medium">
                          {others.map(s => (
                            <option key={`other-${s.id}`} value={s.id} className="text-slate-800">
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
          disabled={isSaving}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/30 active:scale-95 flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />}
          {isSaving ? 'Enregistrement...' : 'Sauvegarder la session'}
        </button>
      </div>
    </div>
  );
};

export default CreateSession;