import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'bg-gray-800 rounded-lg border border-gray-700',
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function CardHeader({ icon, title, description, action }: CardHeaderProps) {
  return (
    <div className="flex items-start gap-4">
      {icon && <div className="p-3 bg-gray-700 rounded-lg">{icon}</div>}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-white">{title}</h3>
          {action}
        </div>
        {description && <p className="text-sm text-gray-400">{description}</p>}
      </div>
    </div>
  );
}
