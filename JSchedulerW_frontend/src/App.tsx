import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import StudentManagement from './pages/StudentManagement';
import CreateSession from './pages/CreateSession'

const App = () => {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50 font-sans">
        {/* La Sidebar est fixe à gauche pour toutes les routes */}
        <Sidebar />
        
        {/* La zone principale change en fonction de l'URL */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            {/* Redirection par défaut vers la gestion des élèves */}
            <Route path="/" element={<Navigate to="/students" replace />} />
            
            {/* Nos deux routes principales */}
            <Route path="/students" element={<StudentManagement />} />
            <Route path="/schedule" element={<CreateSession />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;