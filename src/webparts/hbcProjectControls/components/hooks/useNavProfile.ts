import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';

const MAX_RECENT = 5;
const STORAGE_PREFIX = 'hbc:nav-profile:';

interface INavProfile {
  favorites: string[];
  recent: string[];
}

const defaultProfile: INavProfile = { favorites: [], recent: [] };

function getStorageKey(email: string): string {
  return `${STORAGE_PREFIX}${email}`;
}

function readProfile(email: string | undefined): INavProfile {
  if (!email || typeof window === 'undefined') return defaultProfile;
  try {
    const raw = window.localStorage.getItem(getStorageKey(email));
    if (!raw) return defaultProfile;
    const parsed = JSON.parse(raw) as Partial<INavProfile>;
    return {
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      recent: Array.isArray(parsed.recent) ? parsed.recent : [],
    };
  } catch {
    return defaultProfile;
  }
}

function writeProfile(email: string | undefined, profile: INavProfile): void {
  if (!email || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(getStorageKey(email), JSON.stringify(profile));
  } catch {
    // best-effort persistence
  }
}

export interface IUseNavProfileResult {
  favorites: string[];
  recent: string[];
  addRecent: (projectCode: string) => void;
  toggleFavorite: (projectCode: string) => void;
  isFavorite: (projectCode: string) => boolean;
}

/**
 * Manages user navigation profile (favorites/recent projects) in localStorage.
 * Scoped to user email. Max 5 recent items (FIFO).
 */
export function useNavProfile(): IUseNavProfileResult {
  const { currentUser } = useAppContext();
  const email = currentUser?.email;

  const [profile, setProfile] = React.useState<INavProfile>(() => readProfile(email));

  // Re-read profile when email changes
  React.useEffect(() => {
    setProfile(readProfile(email));
  }, [email]);

  // Sync to localStorage on profile changes
  const profileRef = React.useRef(profile);
  profileRef.current = profile;

  const persist = React.useCallback((next: INavProfile) => {
    setProfile(next);
    writeProfile(email, next);
  }, [email]);

  const addRecent = React.useCallback((projectCode: string) => {
    const prev = profileRef.current;
    const filtered = prev.recent.filter(c => c !== projectCode);
    const next = [projectCode, ...filtered].slice(0, MAX_RECENT);
    persist({ ...prev, recent: next });
  }, [persist]);

  const toggleFavorite = React.useCallback((projectCode: string) => {
    const prev = profileRef.current;
    const isFav = prev.favorites.includes(projectCode);
    const favorites = isFav
      ? prev.favorites.filter(c => c !== projectCode)
      : [...prev.favorites, projectCode];
    persist({ ...prev, favorites });
  }, [persist]);

  const isFavorite = React.useCallback((projectCode: string): boolean => {
    return profileRef.current.favorites.includes(projectCode);
  }, []);

  return { favorites: profile.favorites, recent: profile.recent, addRecent, toggleFavorite, isFavorite };
}
