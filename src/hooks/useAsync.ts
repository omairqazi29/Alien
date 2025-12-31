import { useState, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseAsyncReturn<T, Args extends unknown[]> extends AsyncState<T> {
  execute: (...args: Args) => Promise<T | null>;
  reset: () => void;
}

export function useAsync<T, Args extends unknown[] = []>(
  asyncFn: (...args: Args) => Promise<T>
): UseAsyncReturn<T, Args> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setState({ data: null, loading: true, error: null });
      try {
        const result = await asyncFn(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setState({ data: null, loading: false, error: message });
        return null;
      }
    },
    [asyncFn]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

// Simplified version for operations that don't return data
export function useAsyncAction<Args extends unknown[] = []>(
  asyncFn: (...args: Args) => Promise<void>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const execute = useCallback(
    async (...args: Args): Promise<boolean> => {
      setLoading(true);
      setError(null);
      setSuccess(false);
      try {
        await asyncFn(...args);
        setSuccess(true);
        setLoading(false);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        setLoading(false);
        return false;
      }
    },
    [asyncFn]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  }, []);

  return { loading, error, success, execute, reset };
}
