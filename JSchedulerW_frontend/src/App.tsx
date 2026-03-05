import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import StudentManagement from './pages/StudentManagement';
import ProgrammeManagement from './pages/ProgrammeManagement';
import Dashboard from './pages/Dashboard';
import CreateSession from './pages/CreateSession';

const App = () => {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50 font-sans">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<StudentManagement />} />
            
            {/* La liste des semaines */}
            <Route path="/programmes" element={<ProgrammeManagement />} />
            
            {/* L'ordonnanceur d'une semaine spécifique (:id) */}
            <Route path="/schedule/:id" element={<CreateSession />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;