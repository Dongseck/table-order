import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api/client';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

interface UseApiResult<T> extends UseApiState<T> {
  run: () => Promise<T | null>;
  setData: (data: T | null) => void;
}

export function useApi<T>(fn: () => Promise<T>, opts: { auto?: boolean } = {}): UseApiResult<T> {
  const auto = opts.auto ?? true;
  const [state, setState] = useState<UseApiState<T>>({ data: null, loading: auto, error: null });

  const run = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await fn();
      setState({ data, loading: false, error: null });
      return data;
    } catch (e) {
      const apiErr = e instanceof ApiError ? e : new ApiError('UNKNOWN', String(e), 0);
      setState({ data: null, loading: false, error: apiErr });
      return null;
    }
  }, [fn]);

  useEffect(() => {
    if (auto) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...state,
    run,
    setData: (data) => setState((s) => ({ ...s, data })),
  };
}
