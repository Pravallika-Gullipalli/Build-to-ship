import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { getAvatarUrl } from '../utils/avatar';
import type { UserRole } from '../types/user';
import {
  LayoutDashboard,
  FilePlus,
  History,
  Map,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Shield,
  Layers,
  Cpu,
  BarChart3,
  Users
} from 'lucide-react';

interface SidebarLink {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles: UserRole[];
}

const sidebarLinks: SidebarLink[] = [
  // Citizen links
  { to: '/citizen/dashboard', label: 'My Complaints', icon: LayoutDashboard, roles: ['citizen'] },
  { to: '/citizen/report', label: 'Report Issue', icon: FilePlus, roles: ['citizen'] },
  { to: '/citizen/history', label: 'History Feed', icon: History, roles: ['citizen'] },
  { to: '/map-view', label: 'Civic Map', icon: Map, roles: ['officer'] },
  
  // Officer links
  { to: '/officer/dashboard', label: 'Officer Queue', icon: LayoutDashboard, roles: ['officer'] },
  
  // Admin links
  { to: '/admin/dashboard', label: 'Admin Panel', icon: Shield, roles: ['admin'] },
  { to: '/admin/users', label: 'Users Directory', icon: Users, roles: ['admin'] },
  { to: '/admin/ai-logs', label: 'AI Logs', icon: Cpu, roles: ['admin'] },
  
  // Shared
  { to: '/analytics', label: 'City Analytics', icon: BarChart3, roles: ['officer', 'admin'] },
  { to: '/profile', label: 'My Profile', icon: User, roles: ['citizen', 'officer', 'admin'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['citizen', 'officer', 'admin'] }
];

export const DashboardLayout: React.FC = () => {
  const { user, isLoading, logout, isCitizen, isOfficer } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Restoring session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Filter links by current role
  const activeLinks = sidebarLinks.filter(link => link.roles.includes(user.role));



  const handleLogout = async () => {
    await logout();
    showToast('info', 'Logged Out', 'Successfully logged out of AI CivicFix.');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-slate-800/50 m-4 rounded-2xl p-4 shadow-xl z-20">
        <div className="flex items-center gap-2 px-2 py-4 border-b border-slate-200 dark:border-slate-800/40">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-glow-blue">
            <Layers size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">AI CivicFix</h1>
            <p className="text-[10px] text-slate-400 font-medium">Smart City Portal</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 flex flex-col gap-1.5 mt-6">
          {activeLinks.map(link => {
            const isActive = location.pathname === link.to;
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-glow-blue'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900/40'
                  }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer info & Logout */}
        <div className="border-t border-slate-200 dark:border-slate-800/40 pt-4 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <aside className={`fixed top-0 bottom-0 left-0 w-64 glass-panel border-r border-slate-800/50 p-4 shadow-xl z-50 transition-transform duration-300 md:hidden
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Layers size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">AI CivicFix</h1>
            </div>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-1.5 mt-6">
          {activeLinks.map(link => {
            const isActive = location.pathname === link.to;
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-glow-blue'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900/40'
                  }`}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800/40 pt-4 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-0">
        
        {/* Header Bar */}
        <header className="flex items-center justify-between px-6 py-4 glass-panel border-b border-slate-800/40 m-4 mb-2 rounded-2xl z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="text-slate-400 hover:text-white md:hidden"
            >
              <Menu size={22} />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isCitizen ? 'Citizen Dashboard' : isOfficer ? 'Officer Command Center' : 'System Operations Control'}
              </h2>
              <p className="text-xs text-slate-400">Welcome, {user.name} ({user.role.toUpperCase()})</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/60 hover:bg-slate-200/50 dark:hover:bg-slate-900/60 text-slate-700 dark:text-slate-300 transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>

            {/* Profile Dropdown with Dev Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(prev => !prev)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-xl border border-slate-200 dark:border-slate-800/60 hover:bg-slate-200/50 dark:hover:bg-slate-900/60 transition-colors"
              >
                <img
                  src={getAvatarUrl(user)}
                  alt={user.name}
                  className="w-8 h-8 rounded-lg object-cover"
                />
                <span className="hidden md:inline text-xs font-semibold text-slate-800 dark:text-slate-300 truncate max-w-[80px]">
                  {user.name.split(' ')[0]}
                </span>
              </button>

              {isProfileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsProfileDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 p-2 rounded-xl border bg-slate-900 border-slate-800 dark:bg-slate-950 dark:border-slate-900 shadow-2xl z-40 text-slate-100">
                    <div className="px-3 py-2 border-b border-slate-800/60">
                      <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                      <p className="text-xxs text-slate-400 truncate">{user.email}</p>
                    </div>



                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full text-left text-xs font-semibold px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Sub-page display content */}
        <main className="flex-1 overflow-y-auto px-6 pb-6 relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col transition-colors duration-300">
      <Outlet />
    </div>
  );
};
