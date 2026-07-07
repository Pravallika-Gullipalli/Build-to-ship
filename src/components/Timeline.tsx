import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock } from 'lucide-react';
import type { TimelineStep } from '../types/complaint';

interface TimelineProps {
  steps: TimelineStep[];
}

export const Timeline: React.FC<TimelineProps> = ({ steps }) => {
  return (
    <div className="relative pl-6 sm:pl-8 py-2">
      {/* Central continuous line */}
      <div className="absolute left-[11px] sm:left-[15px] top-4 bottom-4 w-0.5 bg-slate-800 dark:bg-slate-800 light:bg-slate-200" />

      <div className="flex flex-col gap-8">
        {steps.map((step, idx) => {
          const isCompleted = step.completed;
          // Determine if this is the "active/current" step
          // Active step is the last completed step, or if none, the first.
          const isLastCompleted = isCompleted && (idx === steps.length - 1 || !steps[idx + 1]?.completed);

          return (
            <motion.div
              key={step.status}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="relative flex gap-4 sm:gap-6 items-start"
            >
              {/* Timeline Indicator node */}
              <div className="absolute -left-[27px] sm:-left-[31px] top-1 z-10 flex items-center justify-center">
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border text-white
                      ${isLastCompleted 
                        ? 'bg-blue-600 border-blue-500 shadow-glow-blue animate-pulse' 
                        : 'bg-emerald-600 border-emerald-500'}`}
                  >
                    <Check className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                  </motion.div>
                ) : (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border bg-slate-900 border-slate-700 text-slate-500 light:bg-white light:border-slate-300 light:text-slate-400">
                    <Clock className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                  </div>
                )}
              </div>

              {/* Text content card */}
              <div className={`flex-1 rounded-xl p-4 border transition-all duration-300
                ${isLastCompleted 
                  ? 'bg-blue-950/20 border-blue-500/30 dark:bg-blue-950/15' 
                  : isCompleted
                    ? 'bg-slate-900/40 border-slate-800/40 dark:bg-slate-900/30'
                    : 'bg-slate-900/10 border-slate-800/20 opacity-50 light:bg-slate-50/50 light:border-slate-200/50'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                  <h4 className={`font-semibold text-sm sm:text-base
                    ${isLastCompleted 
                      ? 'text-blue-400 font-bold' 
                      : isCompleted 
                        ? 'text-slate-200 dark:text-slate-200 light:text-slate-800' 
                        : 'text-slate-500'}`}>
                    {step.title}
                  </h4>
                  {step.timestamp && (
                    <span className="text-xxs sm:text-xs text-slate-400 font-medium">
                      {new Date(step.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {step.description || 'Waiting to initiate this step...'}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
export default Timeline;
