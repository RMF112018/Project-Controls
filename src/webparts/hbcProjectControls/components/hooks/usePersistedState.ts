import * as React from 'react';

const PREFIX = 'hbc-persist-';

function readStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${key}`);
    return raw !== null ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function writeStorage<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  } catch { /* quota exceeded or unavailable — silently ignore */ }
}

export function usePersistedState<T>(
  key: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = React.useState<T>(() => readStorage(key, defaultValue));

  React.useEffect(() => {
    writeStorage(key, state);
  }, [key, state]);

  return [state, setState];
}
