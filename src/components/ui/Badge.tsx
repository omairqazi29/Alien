import { cn } from '../../utils/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'amber';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-500/20 text-gray-400',
  success: 'bg-emerald-500/20 text-emerald-400',
  warning: 'bg-yellow-500/20 text-yellow-400',
  error: 'bg-red-500/20 text-red-400',
  info: 'bg-blue-500/20 text-blue-400',
  purple: 'bg-purple-500/20 text-purple-400',
  amber: 'bg-amber-500/20 text-amber-400',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'px-2 py-0.5 text-xs rounded-full font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
