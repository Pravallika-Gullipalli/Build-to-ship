import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDb } from '../utils/mockDb';
import Card from '../components/Card';
import { User, Shield, Briefcase, Mail } from 'lucide-react';
import type { UserRole } from '../types/user';

export const AdminUsers: React.FC = () => {
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  // Query users from local mock DB
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter],
    queryFn: async () => {
      const db = getDb();
      if (roleFilter === 'all') return db.users;
      return db.users.filter(u => u.role === roleFilter);
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-slate-800/40 pb-2">
        <h2 className="text-xl font-bold text-white">Municipal Directory</h2>
        <p className="text-xs text-slate-400">Review and audit registered staff profiles, departments, and roles</p>
      </div>

      {/* Role Filter Selector */}
      <div className="flex gap-2">
        {(['all', 'citizen', 'officer', 'admin'] as const).map(role => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            className={`py-1.5 px-3 rounded-lg border text-xxs font-bold uppercase transition-all duration-200
              ${roleFilter === role
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700'
              }`}
          >
            {role}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="h-64 bg-slate-900 rounded-2xl animate-pulse" />
      ) : (
        <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-0 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="p-4">Profile Info</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">System Role</th>
                  <th className="p-4">Department / Division</th>
                  <th className="p-4 text-right">Registration Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {users && users.map(u => {
                  let Icon = User;
                  let roleColor = 'text-slate-400';
                  if (u.role === 'admin') {
                    Icon = Shield;
                    roleColor = 'text-rose-400';
                  } else if (u.role === 'officer') {
                    Icon = Briefcase;
                    roleColor = 'text-blue-400';
                  }

                  return (
                    <tr key={u.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <img src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'} alt={u.name} className="w-8 h-8 rounded-lg object-cover border border-slate-800 shrink-0" />
                        <div>
                          <p className="font-bold text-white leading-tight">{u.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{u.phone || 'No phone attached'}</p>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-400 flex items-center gap-1">
                        <Mail size={12} className="text-slate-500" />
                        {u.email}
                      </td>
                      <td className={`p-4 font-bold uppercase tracking-wider ${roleColor} flex items-center gap-1`}>
                        <Icon size={12} />
                        {u.role}
                      </td>
                      <td className="p-4 font-semibold text-slate-300">
                        {u.department || 'Not Applicable'}
                      </td>
                      <td className="p-4 text-right font-medium text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
export default AdminUsers;
