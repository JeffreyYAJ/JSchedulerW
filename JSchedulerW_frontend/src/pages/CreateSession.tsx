import React, { useState } from 'react';
import { User, Sparkles, BookOpen, Users as UsersIcon, Mic, CheckCircle2 } from 'lucide-react';

const CreateSession = () => {
  const [activeSlot, setActiveSlot] = useState('sketch3'); 
  const [sketch3Type, setSketch3Type] = useState('sketch3'); 

  const getConfigurationSlots = () => {
    switch (activeSlot) {
      case 'lecture':
        return [
          { id: 1, label: 'Lecteur', rule: 'Uniquement des hommes' }
        ];
      case 'sketch1':
      case 'sketch2':
        return [
          { id: 1, label: 'Élève 1', rule: 'Sélectionner le premier élève' },
          { id: 2, label: 'Élève 2', rule: 'Doit être du même sexe que l\'élève 1' }
        ];
      case 'sketch3':
        if (sketch3Type === 'discours') {
          return [
            { id: 1, label: 'Orateur (Discours)', rule: 'Uniquement des hommes' }
          ];
        }
        return [
          { id: 1, label: 'Élève 1 (Sketch 3)', rule: 'Sélectionner le premier élève' },
          { id: 2, label: 'Élève 2 (Sketch 3)', rule: 'Doit être du même sexe que l\'élève 1' }
        ];
      default:
        return [];
    }
  };

  const slotsToRender = getConfigurationSlots();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-10 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">Create New Session</h1>
          <p className="text-slate-500">Planifiez les exposés et assignez les élèves éligibles aux créneaux.</p>
        </div>
        <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm active:scale-95">
          <Sparkles size={18} /> Smart Suggest
        </button>
      </div>

      {/* Cartes de Sélection */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Session Setup</h2>
        <p className="text-slate-500 mb-6 text-sm">Cliquez sur un créneau pour y assigner des élèves.</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Lecture */}
          <div onClick={() => setActiveSlot('lecture')} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative group ${activeSlot === 'lecture' ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-100 bg-white hover:border-blue-300'}`}>
            {activeSlot === 'lecture' && <CheckCircle2 className="absolute top-4 right-4 text-blue-500 animate-in zoom-in" size={20} />}
            <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${activeSlot === 'lecture' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
              <BookOpen size={24} />
            </div>
            <h3 className="font-bold text-slate-800 mb-1">Lecture</h3>
            <p className="text-sm text-slate-500">1 homme</p>
          </div>

          {/* Sketch 1 */}
          <div onClick={() => setActiveSlot('sketch1')} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative group ${activeSlot === 'sketch1' ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-100 bg-white hover:border-blue-300'}`}>
            {activeSlot === 'sketch1' && <CheckCircle2 className="absolute top-4 right-4 text-blue-500 animate-in zoom-in" size={20} />}
            <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${activeSlot === 'sketch1' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
              <UsersIcon size={24} />
            </div>
            <h3 className="font-bold text-slate-800 mb-1">Sketch 1</h3>
            <p className="text-sm text-slate-500">2 élèves (H-H / F-F)</p>
          </div>

          {/* Sketch 2 */}
          <div onClick={() => setActiveSlot('sketch2')} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative group ${activeSlot === 'sketch2' ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-100 bg-white hover:border-blue-300'}`}>
            {activeSlot === 'sketch2' && <CheckCircle2 className="absolute top-4 right-4 text-blue-500 animate-in zoom-in" size={20} />}
            <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${activeSlot === 'sketch2' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
              <UsersIcon size={24} />
            </div>
            <h3 className="font-bold text-slate-800 mb-1">Sketch 2</h3>
            <p className="text-sm text-slate-500">2 élèves (H-H / F-F)</p>
          </div>

          {/* Sketch 3 / Discours */}
          <div onClick={() => setActiveSlot('sketch3')} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative group ${activeSlot === 'sketch3' ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-100 bg-white hover:border-blue-300'}`}>
            {activeSlot === 'sketch3' && <CheckCircle2 className="absolute top-4 right-4 text-blue-500 animate-in zoom-in" size={20} />}
            <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${activeSlot === 'sketch3' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
              {sketch3Type === 'discours' ? <Mic size={24} /> : <User size={24} />}
            </div>
            <h3 className="font-bold text-slate-800 mb-1">Sketch 3 / Discours</h3>
            <p className="text-sm text-slate-500">Au choix</p>
          </div>
        </div>
      </div>

      {/* ----------------- ZONE DE CONFIGURATION DYNAMIQUE ----------------- */}
      {/* L'astuce est ici : le key={activeSlot} force l'animation à se relancer à chaque clic */}
      <div key={activeSlot} className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800 capitalize">
            Configuration : {activeSlot.replace('sketch', 'Sketch ')}
          </h2>
          
          {/* Toggle pour Sketch 3 uniquement */}
          {activeSlot === 'sketch3' && (
            <div className="flex bg-slate-200/50 p-1.5 rounded-xl border border-slate-200">
              <button 
                onClick={() => setSketch3Type('sketch3')}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                  sketch3Type === 'sketch3' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sketch 3
              </button>
              <button 
                onClick={() => setSketch3Type('discours')}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                  sketch3Type === 'discours' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Discours
              </button>
            </div>
          )}
        </div>

        {/* Lignes générées dynamiquement */}
        <div className="space-y-4">
          {slotsToRender.map((slot) => (
            <div key={slot.id} className="flex items-center justify-between p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:border-blue-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <User size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{slot.label}</h4>
                  <p className="text-sm text-slate-500">{slot.rule}</p>
                </div>
              </div>
              <button className="px-5 py-2.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold rounded-xl text-sm transition-colors border border-slate-200 hover:border-blue-200 active:scale-95">
                Assigner
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/30 active:scale-95">
          Sauvegarder la session
        </button>
      </div>
    </div>
  );
};

export default CreateSession;