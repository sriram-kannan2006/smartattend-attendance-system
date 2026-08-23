import React from 'react';
import { Menu, Search, Settings, User as UserIcon, LogOut, GraduationCap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { NotificationPanel } from '@/components/NotificationPanel/NotificationPanel';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/Dropdown';

export const Navbar = ({ toggleSidebar, isMobile }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-xs">
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Toggle navigation sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        {/* Kongu Engineering College Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-xl border border-slate-200/80">
          <GraduationCap className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-800">
            Kongu Engineering College
          </span>
          <span className="text-[10px] text-slate-400 font-medium border-l border-slate-200 pl-2">
            Autonomous
          </span>
        </div>

        <div className="hidden md:flex relative w-48 lg:w-64">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-xl border border-slate-200 py-1.5 pl-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
            placeholder="Search students, classes..."
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Real-time notification panel */}
        <NotificationPanel />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full p-1 hover:bg-slate-50 transition outline-none focus:ring-2 focus:ring-blue-500">
            <Avatar size="sm" alt={user?.name || 'User'} />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 line-clamp-1">{user?.name || 'User'}</span>
              <span className="text-[10px] text-slate-500 capitalize">{user?.role?.toLowerCase() || 'Member'}</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-slate-900">{user?.name}</p>
                <p className="text-xs leading-none text-slate-500">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserIcon className="mr-2 h-4 w-4 text-slate-500" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4 text-slate-500" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Navbar;
