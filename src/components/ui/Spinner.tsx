import { cn } from '../../utils/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
};

export function Spinner({ size = 'sm', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'border-white/30 border-t-white rounded-full animate-spin',
        sizeClasses[size],
        className
      )}
    />
  );
}
