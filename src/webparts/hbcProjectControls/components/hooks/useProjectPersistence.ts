import * as React from 'react';

const KEY_VERSION = 'v1';
const MAX_RECENT = 5;

interface IProjectPersistenceApi {
  loadPersistedProjectId: () => string | null;
  savePersistedProjectId: (projectId: string | null) => void;
  loadRecents: () => string[];
  saveRecentProject: (projectId: string) => void;
  loadFavorites: () => string[];
  toggleFavoriteProject: (projectId: string) => void;
}

function buildKey(userEmail: string, key: string): string {
  return `hbc:project:${KEY_VERSION}:${userEmail}:${key}`;
}

function readArray(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function writeArray(key: string, value: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // best-effort persistence only
  }
}

export function useProjectPersistence(userEmail: string): IProjectPersistenceApi {
  const safeUser = userEmail || 'anonymous';
  const lastProjectKey = React.useMemo(() => buildKey(safeUser, 'last'), [safeUser]);
  const recentsKey = React.useMemo(() => buildKey(safeUser, 'recent'), [safeUser]);
  const favoritesKey = React.useMemo(() => buildKey(safeUser, 'favorites'), [safeUser]);

  const loadPersistedProjectId = React.useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(lastProjectKey);
    } catch {
      return null;
    }
  }, [lastProjectKey]);

  const savePersistedProjectId = React.useCallback((projectId: string | null): void => {
    if (typeof window === 'undefined') return;
    try {
      if (projectId) {
        window.localStorage.setItem(lastProjectKey, projectId);
      } else {
        window.localStorage.removeItem(lastProjectKey);
      }
    } catch {
      // best-effort persistence only
    }
  }, [lastProjectKey]);

  const loadRecents = React.useCallback((): string[] => {
    return readArray(recentsKey);
  }, [recentsKey]);

  const saveRecentProject = React.useCallback((projectId: string): void => {
    const next = loadRecents().filter((item) => item !== projectId);
    next.unshift(projectId);
    writeArray(recentsKey, next.slice(0, MAX_RECENT));
  }, [loadRecents, recentsKey]);

  const loadFavorites = React.useCallback((): string[] => {
    return readArray(favoritesKey);
  }, [favoritesKey]);

  const toggleFavoriteProject = React.useCallback((projectId: string): void => {
    const existing = new Set(loadFavorites());
    if (existing.has(projectId)) {
      existing.delete(projectId);
    } else {
      existing.add(projectId);
    }
    writeArray(favoritesKey, Array.from(existing));
  }, [favoritesKey, loadFavorites]);

  return React.useMemo(() => ({
    loadPersistedProjectId,
    savePersistedProjectId,
    loadRecents,
    saveRecentProject,
    loadFavorites,
    toggleFavoriteProject,
  }), [
    loadPersistedProjectId,
    savePersistedProjectId,
    loadRecents,
    saveRecentProject,
    loadFavorites,
    toggleFavoriteProject,
  ]);
}

