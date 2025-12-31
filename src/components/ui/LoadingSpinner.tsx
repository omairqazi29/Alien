import { Spinner } from './Spinner';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Spinner size="lg" className="border-emerald-500 border-t-transparent" />
      {message && <p className="text-gray-400 mt-4">{message}</p>}
    </div>
  );
}
