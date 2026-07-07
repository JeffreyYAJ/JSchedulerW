import { NavLink } from 'react-router-dom';
import {
  Calendar, Users, LayoutDashboard,
} from 'lucide-react';
import logo from '../logo.png';

const Sidebar = () => {
  // Fonction utilitaire pour gérer les classes Tailwind du lien actif
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>   
     `w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${
      isActive 
        ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' 
        : 'text-slate-500 hover:bg-slate-50'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col shadow-sm z-10 sticky top-0 h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <img
          src={logo}
          alt="JW Scheduler"
          className="w-11 h-11 rounded-xl object-contain shadow-md ring-1 ring-slate-100"
        />
        <div>
          <h1 className="text-lg font-bold leading-tight text-slate-800">JW</h1>
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">Scheduler</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-3 flex-1">
        <NavLink to="/" className={navLinkClass}>
          <LayoutDashboard size={20} /> Dashboard
        </NavLink>


        <NavLink to="/students" className={navLinkClass}>
          <Users size={20} /> Students
        </NavLink>

        <NavLink to="/programmes" className={navLinkClass}>
          <Calendar size={20} /> Schedule
        </NavLink>

        {/*<button className="w-full flex items-center justify-between text-slate-500 font-semibold p-3 rounded-xl hover:bg-slate-50 transition-colors group">
          <div className="flex items-center gap-3"><BellRing size={20} /> Alerts</div>
          <div className="flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold shadow-md">
            3
          </div>
        </button>*/}
      </nav>

      {/* Footer Sidebar */}
      {/*}
      <div className="space-y-2 pt-6 border-t border-slate-100">
        <button className="w-full flex items-center gap-3 text-slate-500 font-semibold p-3 rounded-xl hover:bg-slate-50 transition-colors">
          <Settings size={20} /> Settings
        </button>
        <button className="w-full flex items-center gap-3 text-red-500 font-semibold p-3 rounded-xl hover:bg-red-50 transition-colors">
          <LogOut size={20} /> Log out
        </button>
      </div> */}
    </aside>
  );
};

export default Sidebar;