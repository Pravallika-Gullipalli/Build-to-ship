import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glow?: boolean;
  glowColor?: 'blue' | 'emerald' | 'rose' | 'amber';
  hoverable?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  glow = false,
  glowColor = 'blue',
  hoverable = true,
  className = '',
  ...props
}) => {
  const glowClasses = {
    blue: 'shadow-glow-blue dark:shadow-glow-blue border-blue-500/20 dark:border-blue-500/20',
    emerald: 'shadow-glow-emerald dark:shadow-glow-emerald border-emerald-500/20 dark:border-emerald-500/20',
    rose: 'shadow-glow-rose dark:shadow-glow-rose border-rose-500/20 dark:border-rose-500/20',
    amber: 'shadow-amber-500/10 dark:shadow-amber-500/10 border-amber-500/20 dark:border-amber-500/20',
  };

  return (
    <div
      className={`
        glass-card p-6 rounded-2xl border
        ${glow ? glowClasses[glowColor] : ''}
        ${hoverable ? 'hover:scale-[1.01] hover:-translate-y-0.5' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
export default Card;
