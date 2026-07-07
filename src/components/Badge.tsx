import type { ComplaintPriority, ComplaintStatus } from '../types/complaint';

interface BadgeProps {
  type: 'priority' | 'status';
  value: ComplaintPriority | ComplaintStatus;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value, className = '' }) => {
  const isPriority = type === 'priority';

  let bgClass = '';
  let label = value.replace('_', ' ');

  // Standardize styling
  if (isPriority) {
    switch (value as ComplaintPriority) {
      case 'critical':
        bgClass = 'bg-rose-500/10 border-rose-500/30 text-rose-500 dark:text-rose-400';
        break;
      case 'high':
        bgClass = 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400';
        break;
      case 'medium':
        bgClass = 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400';
        break;
      case 'low':
        bgClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400';
        break;
    }
  } else {
    switch (value as ComplaintStatus) {
      case 'submitted':
        bgClass = 'bg-slate-500/10 border-slate-500/30 text-slate-600 dark:text-slate-400';
        break;
      case 'ai_verified':
        bgClass = 'bg-violet-500/10 border-violet-500/30 text-violet-600 dark:text-violet-400';
        label = 'AI Verified';
        break;
      case 'assigned':
        bgClass = 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400';
        break;
      case 'work_started':
        bgClass = 'bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400';
        label = 'Work Started';
        break;
      case 'resolved':
        bgClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400';
        break;
    }
  }

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm uppercase tracking-wider
        ${bgClass}
        ${className}
      `}
    >
      {label}
    </span>
  );
};
export default Badge;
