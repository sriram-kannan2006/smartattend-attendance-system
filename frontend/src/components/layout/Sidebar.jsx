import React from 'react';
import { NavLink } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/utils/constants';
import { useAuth } from '@/context/AuthContext';
import { LogOut } from 'lucide-react';

export const Sidebar = ({ expanded, setExpanded, isMobile }) => {
  const { user, logout } = useAuth();
  
  if (!user) return null;

  const role = user.role || 'STUDENT';
  const navItems = NAV_ITEMS[role] || [];

  const handleLinkClick = () => {
    if (isMobile) {
      setExpanded(false);
    }
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col bg-slate-950 text-white transition-all duration-300 ease-in-out border-r border-slate-800",
        expanded ? "w-64" : "w-[72px]",
        isMobile && !expanded && "-translate-x-full"
      )}
    >
      {/* College & Site Branding */}
      <div className="flex h-20 shrink-0 items-center justify-between px-3.5 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap w-full">
          <div className="h-12 w-12 shrink-0 bg-white p-1 rounded-xl flex items-center justify-center shadow-md overflow-hidden">
            <img
              src="/kec-logo.png"
              alt="Kongu Engineering College Logo"
              className="w-full h-full object-contain"
            />
          </div>
          {expanded && (
            <div className="flex flex-col min-w-0">
              <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                SmartAttend
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-600/80 text-blue-100 font-bold uppercase tracking-wider">
                  KEC
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium truncate">
                Kongu Engineering College
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden pt-4 pb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = LucideIcons[item.icon] || LucideIcons.Circle;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all relative group",
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  )
                }
                title={!expanded ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    {isActive && !expanded && (
                      <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r bg-blue-500" />
                    )}
                    <Icon className="h-5 w-5 shrink-0" />
                    {expanded && <span>{item.label}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-slate-800 p-3.5 bg-slate-900/40">
        {expanded ? (
          <div className="flex items-center justify-between">
            <div className="flex flex-col overflow-hidden min-w-0">
              <span className="truncate text-xs font-bold text-white">{user.name}</span>
              <span className="truncate text-[10px] text-slate-400">{user.email}</span>
            </div>
            <button 
              onClick={logout}
              className="ml-2 flex shrink-0 items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="flex w-full items-center justify-center rounded-xl py-2 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
