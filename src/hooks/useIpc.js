import { useState, useCallback } from 'react';

/**
 * Hook: Wraps IPC calls with loading/error/data state management.
 * Provides consistent error handling for all electronAPI calls.
 *
 * Usage:
 *   const { call, loading, error, data } = useIpc();
 *   const products = await call(() => window.electronAPI.getProducts());
 */
export function useIpc() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const call = useCallback(async (ipcFn) => {
    setLoading(true);
    setError(null);

    try {
      const result = await ipcFn();

      if (result && result.success === false) {
        setError(result.error || 'Operation failed');
        setData(null);
        setLoading(false);
        return null;
      }

      const responseData = result?.data ?? result;
      setData(responseData);
      setLoading(false);
      return responseData;
    } catch (err) {
      const message = err?.message || 'Unexpected error';
      setError(message);
      setData(null);
      setLoading(false);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { call, loading, error, data, reset };
}
