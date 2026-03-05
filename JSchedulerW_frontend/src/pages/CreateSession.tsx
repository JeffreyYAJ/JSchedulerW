import React, { useState } from 'react';
import { Calendar, Sparkles, BookOpen, Users, Mic, User, CheckCircle2 } from 'lucide-react';

const CreateSession = () => {
  // États pour gérer l'interface
  const [activeSlot, setActiveSlot] = useState('sketch3'); // 'lecture', 'sketch1', 'sketch2', 'sketch3'
  const [sketch3Type, setSketch3Type] = useState('sketch3'); // 'sketch3' ou 'discours'

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      {/* ----------------- HEADER NAV ----------------- */}
      <header className="border-b border-slate-100 py-4 px-8 flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Calendar className="text-blue-600" size={24} />
          <span className="text-xl font-bold">ExposéPlanner</span>
        </div>
        <nav className="flex items-center gap-8 text-sm font-medium text-slate-500">
          <a href="#" className="hover:text-slate-800 transition-colors">Dashboard</a>
          <a href="#" className="text-blue-600">Sessions</a>
          <a href="#" className="hover:text-slate-800 transition-colors">Students</a>
          <a href="#" className="hover:text-slate-800 transition-colors">Settings</a>
          <div className="w-8 h-8 rounded-full bg-orange-200 ml-4 border-2 border-white shadow-sm"></div>
        </nav>
      </header>

      {/* ----------------- MAIN CONTENT ----------------- */}
      <main className="max-w-4xl mx-auto py-10 px-4">
        
        {/* Page Title & Smart Suggest */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-bold mb-2">Create New Session</h1>
            <p className="text-slate-500">Plan exposés and assign eligible students to presentation slots.</p>
          </div>
          <button className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
            <Sparkles size={18} /> Smart Suggest
          </button>
        </div>

        {/* Session Setup Section */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-2">Session Setup</h2>
          <p className="text-slate-500 mb-6 text-sm">Configure the slots for this session. The system highlights overdue students.</p>

          {/* Slots Cards */}
          <div className="grid grid-cols-4 gap-4">
            {/* Card 1: Lecture */}
            <div 
              onClick={() => setActiveSlot('lecture')}
              className={`p-5 rounded-xl border cursor-pointer transition-all relative ${
                activeSlot === 'lecture' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              {activeSlot === 'lecture' && <CheckCircle2 className="absolute top-3 right-3 text-blue-500" size={18} />}
              <BookOpen className={`mb-3 ${activeSlot === 'lecture' ? 'text-blue-600' : 'text-slate-600'}`} size={24} />
              <h3 className="font-bold mb-1">Lecture</h3>
              <p className="text-sm text-slate-500">Assigned: Sarah Jenkins</p>
            </div>

            {/* Card 2: Sketch 1 */}
            <div 
              onClick={() => setActiveSlot('sketch1')}
              className={`p-5 rounded-xl border cursor-pointer transition-all relative ${
                activeSlot === 'sketch1' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              {activeSlot === 'sketch1' && <CheckCircle2 className="absolute top-3 right-3 text-blue-500" size={18} />}
              <Users className={`mb-3 ${activeSlot === 'sketch1' ? 'text-blue-600' : 'text-slate-600'}`} size={24} />
              <h3 className="font-bold mb-1">Sketch 1</h3>
              <p className="text-sm text-slate-500">Needs 2 students</p>
            </div>

            {/* Card 3: Sketch 2 */}
            <div 
              onClick={() => setActiveSlot('sketch2')}
              className={`p-5 rounded-xl border cursor-pointer transition-all relative ${
                activeSlot === 'sketch2' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              {activeSlot === 'sketch2' && <CheckCircle2 className="absolute top-3 right-3 text-blue-500" size={18} />}
              <Users className={`mb-3 ${activeSlot === 'sketch2' ? 'text-blue-600' : 'text-slate-600'}`} size={24} />
              <h3 className="font-bold mb-1">Sketch 2</h3>
              <p className="text-sm text-slate-500">Needs 2 students</p>
            </div>

            {/* Card 4: Sketch 3 / Discours */}
            <div 
              onClick={() => setActiveSlot('sketch3')}
              className={`p-5 rounded-xl border cursor-pointer transition-all relative ${
                activeSlot === 'sketch3' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              {activeSlot === 'sketch3' && <CheckCircle2 className="absolute top-3 right-3 text-blue-500" size={18} />}
              {sketch3Type === 'discours' ? (
                <Mic className={`mb-3 ${activeSlot === 'sketch3' ? 'text-blue-600' : 'text-slate-600'}`} size={24} />
              ) : (
                <User className={`mb-3 ${activeSlot === 'sketch3' ? 'text-blue-600' : 'text-slate-600'}`} size={24} />
              )}
              <h3 className="font-bold mb-1">Sketch 3 / Discours</h3>
              <p className="text-sm text-slate-500">Select type below</p>
            </div>
          </div>
        </div>

        {/* ----------------- SLOT CONFIGURATION ----------------- */}
        {activeSlot === 'sketch3' && (
          <div className="mb-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Slot: Sketch 3 / Discours Configuration</h2>
              
              {/* Toggle Switch */}
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button 
                  onClick={() => setSketch3Type('sketch3')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    sketch3Type === 'sketch3' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Sketch 3
                </button>
                <button 
                  onClick={() => setSketch3Type('discours')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    sketch3Type === 'discours' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Discours
                </button>
              </div>
            </div>

            {/* Assignment Rows */}
            <div className="space-y-3">
              {/* Slot 1 (Always visible) */}
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                    <User size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">Student 1</h4>
                    <p className="text-sm text-slate-500">Select eligible student</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-sm transition-colors">
                  Assign Student
                </button>
              </div>

              {/* Slot 2 (Visible only if Sketch 3) */}
              {sketch3Type === 'sketch3' && (
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800">Student 2</h4>
                      <p className="text-sm text-slate-500">Select eligible student</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-sm transition-colors">
                    Assign Student
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------- SUGGESTED CANDIDATES ----------------- */}
        <div className="mb-10">
          <h3 className="font-bold text-lg mb-4">Suggested Candidates (Urgent)</h3>
          <div className="flex gap-4">
            {/* Candidate 1 */}
            <div className="flex-1 flex items-center justify-between p-4 rounded-xl border border-red-200 bg-red-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold overflow-hidden">
                  <img src="/api/placeholder/40/40" alt="Avatar" className="w-full h-full object-cover opacity-80" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 text-sm">Michael Chang</h4>
                  <p className="text-xs text-red-500 font-medium">Overdue by 3 weeks</p>
                </div>
              </div>
              <button className="text-blue-600 text-sm font-medium hover:text-blue-800">Assign</button>
            </div>

            {/* Candidate 2 */}
            <div className="flex-1 flex items-center justify-between p-4 rounded-xl border border-orange-200 bg-orange-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold overflow-hidden">
                  <img src="/api/placeholder/40/40" alt="Avatar" className="w-full h-full object-cover opacity-80" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 text-sm">Emma Wilson</h4>
                  <p className="text-xs text-orange-500 font-medium">Overdue by 1 week</p>
                </div>
              </div>
              <button className="text-blue-600 text-sm font-medium hover:text-blue-800">Assign</button>
            </div>
          </div>
        </div>

        {/* ----------------- ACTION FOOTER ----------------- */}
        <div className="flex justify-end pt-6 border-t border-slate-100">
          <button className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
            Save Session
          </button>
        </div>

      </main>
    </div>
  );
};

export default CreateSession;