import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import Card from '../components/Card';
import { Briefcase, Mail, Phone, Calendar } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('success', 'Profile Updated', 'Demo profile settings saved successfully.');
  };

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-slate-800/40 pb-2">
        <h2 className="text-xl font-bold text-white">My Portal Profile</h2>
        <p className="text-xs text-slate-400">View and update your personal credentials and municipal contact info</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Info Card */}
        <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-6 flex flex-col items-center text-center gap-4">
          <img
            src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
            alt={user.name}
            className="w-24 h-24 rounded-full object-cover border-2 border-blue-500/30 p-1"
          />
          <div>
            <h3 className="text-lg font-bold text-white">{user.name}</h3>
            <span className="text-xxs px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold uppercase tracking-wider mt-1.5 inline-block">
              {user.role} view
            </span>
          </div>

          <div className="w-full border-t border-slate-800/60 pt-4 flex flex-col gap-3 text-xs text-left text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-slate-500 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-slate-500 shrink-0" />
                <span>{user.phone}</span>
              </div>
            )}
            {user.department && (
              <div className="flex items-center gap-2">
                <Briefcase size={14} className="text-slate-500 shrink-0" />
                <span>Dept: {user.department}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-slate-500 shrink-0" />
              <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </Card>

        {/* Right: Update Form */}
        <div className="lg:col-span-2">
          <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-6">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white border-b border-slate-800/60 pb-3 mb-5">
              Account Parameters
            </h3>

            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Display Name</label>
                  <input
                    type="text"
                    defaultValue={user.name}
                    className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Phone Number</label>
                  <input
                    type="text"
                    defaultValue={user.phone || '+1 (555) 012-3456'}
                    className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Email Address (Read-only)</label>
                <input
                  type="email"
                  readOnly
                  disabled
                  value={user.email}
                  className="bg-slate-950/40 border border-slate-800/60 rounded-xl px-4 py-2.5 text-xs outline-none text-slate-500"
                />
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 hover:shadow-glow-blue text-white font-bold text-xs py-3 rounded-xl transition-all self-start px-6 mt-2"
              >
                Save Changes
              </button>
            </form>
          </Card>
        </div>

      </div>
    </div>
  );
};
export default ProfilePage;
