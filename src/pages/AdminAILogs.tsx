import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { aiService } from '../services/aiService';
import Card from '../components/Card';
import { Cpu, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export const AdminAILogs: React.FC = () => {
  // Query AI logs via TanStack Query
  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-ai-logs'],
    queryFn: () => aiService.getLogs()
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-slate-800/40 pb-2">
        <h2 className="text-xl font-bold text-white">System AI Processing Audit Logs</h2>
        <p className="text-xs text-slate-400">Review real-time predictions, classification weights, and automated SLA logs</p>
      </div>

      {isLoading ? (
        <div className="h-64 bg-slate-900 rounded-2xl animate-pulse" />
      ) : (
        <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-0 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="p-4">Process Trigger</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Confidence Factor</th>
                  <th className="p-4">Prediction Outcome</th>
                  <th className="p-4 text-right">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {logs && logs.map(log => {
                  let StatusIcon = Info;
                  let colorClass = 'text-blue-400 bg-blue-500/10 border-blue-500/30';
                  
                  if (log.status === 'success') {
                    StatusIcon = CheckCircle;
                    colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
                  } else if (log.status === 'warning') {
                    StatusIcon = AlertTriangle;
                    colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-4 font-bold text-white flex items-center gap-2">
                        <Cpu size={14} className="text-violet-400 shrink-0" />
                        {log.action}
                      </td>
                      <td className="p-4 text-slate-400 font-medium">
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td className="p-4 font-bold text-slate-300">
                        {(log.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="p-4 font-semibold text-slate-400 max-w-sm truncate">
                        {log.outcome}
                      </td>
                      <td className="p-4 text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] uppercase font-bold tracking-wider ${colorClass}`}>
                          <StatusIcon size={10} />
                          {log.status}
                        </span>
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
export default AdminAILogs;
