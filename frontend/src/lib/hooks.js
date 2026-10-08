import { useCallback, useEffect, useRef, useState } from 'react';
import api, { errorText } from '../api';

// Load JSON from the API; reload() fetches again without flashing the loading state.
export function useApi(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const alive = useRef(true);

  const load = useCallback(async () => {
    if (!path) return;
    try {
      const res = await api.get(path);
      if (alive.current) {
        setData(res.data);
        setError(null);
      }
    } catch (e) {
      if (alive.current) setError(errorText(e));
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    alive.current = true;
    setLoading(true);
    load();
    return () => {
      alive.current = false;
    };
  }, [load]);

  return { data, error, loading, reload: load, setData };
}

export function useInterval(fn, ms) {
  const saved = useRef(fn);
  useEffect(() => {
    saved.current = fn;
  }, [fn]);
  useEffect(() => {
    if (!ms) return undefined;
    const id = setInterval(() => saved.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}
