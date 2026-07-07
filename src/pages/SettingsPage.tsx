import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import Card from '../components/Card';
import { Sun, Moon, Bell, Eye } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useNotification();

  const handleToggleNotifications = () => {
    showToast('info', 'Settings Updated', 'Notification preferences updated.');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-slate-800/40 pb-2">
        <h2 className="text-xl font-bold text-white">System Settings</h2>
        <p className="text-xs text-slate-400">Configure visual themes, alerts, and demographic tags</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Visual Settings */}
        <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-5 flex flex-col gap-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-white border-b border-slate-800/60 pb-3 flex items-center gap-1.5">
            <Eye size={14} className="text-blue-500" />
            Appearance Toggles
          </h3>

          <div className="flex justify-between items-center text-xs">
            <div>
              <p className="font-bold text-slate-200">System Color Theme</p>
              <p className="text-xxs text-slate-400 mt-0.5">Toggle between light and dark glassmorphism modes</p>
            </div>
            
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl text-xxs font-bold uppercase hover:border-slate-700 transition-colors"
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={12} className="text-amber-400" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon size={12} className="text-slate-400" />
                  Dark Mode
                </>
              )}
            </button>
          </div>
        </Card>

        {/* Alerts Configuration */}
        <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-5 flex flex-col gap-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-white border-b border-slate-800/60 pb-3 flex items-center gap-1.5">
            <Bell size={14} className="text-emerald-500" />
            Notifications Parameters
          </h3>

          <div className="flex flex-col gap-3">
            <label className="flex items-center justify-between cursor-pointer select-none text-xs">
              <div>
                <p className="font-bold text-slate-200">Enable Alert Toasts</p>
                <p className="text-xxs text-slate-400 mt-0.5">Show notifications when AI logs or status changes</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                onChange={handleToggleNotifications}
                className="w-8 h-4 rounded-full bg-slate-950 border-slate-800 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer select-none text-xs border-t border-slate-800/40 pt-3">
              <div>
                <p className="font-bold text-slate-200">Email Updates</p>
                <p className="text-xxs text-slate-400 mt-0.5">Receive digests of resolved community cases weekly</p>
              </div>
              <input
                type="checkbox"
                onChange={handleToggleNotifications}
                className="w-8 h-4 rounded-full bg-slate-950 border-slate-800 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>
        </Card>

      </div>
    </div>
  );
};
export default SettingsPage;
