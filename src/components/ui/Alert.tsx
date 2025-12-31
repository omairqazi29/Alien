import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

type AlertVariant = 'error' | 'success' | 'info' | 'warning';

interface AlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
}

const variantConfig: Record<AlertVariant, { icon: React.ElementType; classes: string }> = {
  error: {
    icon: XCircle,
    classes: 'bg-red-500/10 border-red-500/50 text-red-400',
  },
  success: {
    icon: CheckCircle,
    classes: 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400',
  },
  info: {
    icon: Info,
    classes: 'bg-blue-500/10 border-blue-500/50 text-blue-400',
  },
  warning: {
    icon: AlertCircle,
    classes: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400',
  },
};

export function Alert({ variant = 'info', children, className }: AlertProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className={cn('p-3 border rounded-lg flex items-center gap-2', config.classes, className)}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm">{children}</span>
    </div>
  );
}
