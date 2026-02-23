import { IUserProfileService, INavProfile } from './IUserProfileService';

const MAX_RECENT = 5;
const STORAGE_PREFIX = 'hbc:nav-profile:';

const defaultProfile: INavProfile = { favorites: [], recent: [], preferredRegion: null, preferredDivision: null };

function getStorageKey(email: string): string {
  return `${STORAGE_PREFIX}${email}`;
}

export class UserProfileService implements IUserProfileService {
  getNavProfile(userEmail: string): INavProfile {
    if (typeof window === 'undefined') return { ...defaultProfile };
    try {
      const raw = window.localStorage.getItem(getStorageKey(userEmail));
      if (!raw) return { ...defaultProfile };
      const parsed = JSON.parse(raw) as Partial<INavProfile>;
      return {
        favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
        recent: Array.isArray(parsed.recent) ? parsed.recent : [],
        preferredRegion: typeof parsed.preferredRegion === 'string' ? parsed.preferredRegion : null,
        preferredDivision: typeof parsed.preferredDivision === 'string' ? parsed.preferredDivision : null,
      };
    } catch {
      return { ...defaultProfile };
    }
  }

  addRecent(userEmail: string, projectCode: string): void {
    const profile = this.getNavProfile(userEmail);
    const filtered = profile.recent.filter(c => c !== projectCode);
    profile.recent = [projectCode, ...filtered].slice(0, MAX_RECENT);
    this.persist(userEmail, profile);
  }

  toggleFavorite(userEmail: string, projectCode: string): void {
    const profile = this.getNavProfile(userEmail);
    const idx = profile.favorites.indexOf(projectCode);
    if (idx >= 0) {
      profile.favorites.splice(idx, 1);
    } else {
      profile.favorites.push(projectCode);
    }
    this.persist(userEmail, profile);
  }

  isFavorite(userEmail: string, projectCode: string): boolean {
    const profile = this.getNavProfile(userEmail);
    return profile.favorites.includes(projectCode);
  }

  reorderFavorites(userEmail: string, orderedCodes: string[]): void {
    const profile = this.getNavProfile(userEmail);
    const currentSet = new Set(profile.favorites);
    profile.favorites = orderedCodes.filter(c => currentSet.has(c));
    for (const fav of currentSet) {
      if (!profile.favorites.includes(fav)) profile.favorites.push(fav);
    }
    this.persist(userEmail, profile);
  }

  setRegionFilter(userEmail: string, region: string | null): void {
    const profile = this.getNavProfile(userEmail);
    profile.preferredRegion = region;
    this.persist(userEmail, profile);
  }

  setDivisionFilter(userEmail: string, division: string | null): void {
    const profile = this.getNavProfile(userEmail);
    profile.preferredDivision = division;
    this.persist(userEmail, profile);
  }

  clearNavProfile(userEmail: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(getStorageKey(userEmail));
    } catch {
      // best-effort
    }
  }

  private persist(userEmail: string, profile: INavProfile): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        getStorageKey(userEmail),
        JSON.stringify(profile)
      );
    } catch {
      // best-effort persistence
    }
  }
}
