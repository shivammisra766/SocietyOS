import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function NavItem({ to, icon, label, end = false }) {
  return (
    <NavLink 
      to={to} 
      end={end}
      className={({ isActive }) => 
        `group flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden font-medium no-underline ${
          isActive 
            ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]' 
            : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200 border border-transparent'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-md shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>}
          <span className={`material-symbols-outlined transition-transform duration-300 ${isActive ? 'scale-110 text-indigo-400' : 'group-hover:scale-110'}`}>{icon}</span>
          <span className="tracking-wide text-sm">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="w-72 border-r border-indigo-500/10 bg-[#06080c] flex flex-col shrink-0 relative overflow-y-auto no-scrollbar shadow-2xl">
      {/* Decorative gradient orb */}
      <div className="absolute top-0 left-0 w-full h-64 bg-indigo-500/10 blur-[120px] pointer-events-none"></div>
      
      <div className="p-8 pb-6 relative z-10">
        <div className="flex items-center gap-4">
          <img src="/icon.png" alt="appartment" className='w-12 h-12 rounded-xl' />
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-white via-indigo-100 to-slate-400 bg-clip-text text-transparent tracking-tight">SocietyOS</h1>
            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mt-0.5">Admin Portal</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 relative z-10">
        <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Main Menu</p>
        <nav className="space-y-1">
          <NavItem to="/admin" end={true} icon="space_dashboard" label="Dashboard Overview" />
          <NavItem to="/admin/users" icon="group" label="Resident Directory" />
          <NavItem to="/admin/security" icon="local_police" label="Security & Guards" />
          <NavItem to="/admin/service" icon="engineering" label="Service Staff" />
          <NavItem to="/admin/settings" icon="admin_panel_settings" label="Roles & Access" />
        </nav>
      </div>

      <div className="px-5 py-5 mt-2 relative z-10">
        <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Operations</p>
        <nav className="space-y-1">
          <NavItem to="/admin/flats" icon="corporate_fare" label="Flat Registry" />
          <NavItem to="/admin/entries" icon="sensor_door" label="Gate Logs" />
          <NavItem to="/admin/complaints" icon="error" label="Tickets" />
          <NavItem to="/admin/notices" icon="campaign" label="Announcements" />
        </nav>
      </div>

      <div className="px-5 mt-auto mb-8 pt-6 border-t border-indigo-500/10 relative z-10">
        <button 
          onClick={() => navigate("/admin/help")}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/[0.03] hover:text-white transition-all rounded-xl cursor-pointer border-none bg-transparent"
        >
          <span className="material-symbols-outlined">help_center</span>
          <span className="font-medium text-sm">Help & Support</span>
        </button>
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all rounded-xl mt-1 cursor-pointer border-none bg-transparent">
          <span className="material-symbols-outlined">logout</span>
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
