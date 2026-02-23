import { IUserProfileService, INavProfile } from './IUserProfileService';

const MAX_RECENT = 5;
const defaultProfile = (): INavProfile => ({ favorites: [], recent: [], preferredRegion: null, preferredDivision: null });

export class MockUserProfileService implements IUserProfileService {
  private profiles = new Map<string, INavProfile>();

  getNavProfile(userEmail: string): INavProfile {
    const profile = this.profiles.get(userEmail);
    if (!profile) return defaultProfile();
    return {
      favorites: [...profile.favorites],
      recent: [...profile.recent],
      preferredRegion: profile.preferredRegion ?? null,
      preferredDivision: profile.preferredDivision ?? null,
    };
  }

  addRecent(userEmail: string, projectCode: string): void {
    const profile = this.getOrCreate(userEmail);
    const filtered = profile.recent.filter(c => c !== projectCode);
    profile.recent = [projectCode, ...filtered].slice(0, MAX_RECENT);
  }

  toggleFavorite(userEmail: string, projectCode: string): void {
    const profile = this.getOrCreate(userEmail);
    const idx = profile.favorites.indexOf(projectCode);
    if (idx >= 0) {
      profile.favorites.splice(idx, 1);
    } else {
      profile.favorites.push(projectCode);
    }
  }

  isFavorite(userEmail: string, projectCode: string): boolean {
    const profile = this.profiles.get(userEmail);
    return profile ? profile.favorites.includes(projectCode) : false;
  }

  reorderFavorites(userEmail: string, orderedCodes: string[]): void {
    const profile = this.getOrCreate(userEmail);
    const currentSet = new Set(profile.favorites);
    profile.favorites = orderedCodes.filter(c => currentSet.has(c));
    for (const fav of currentSet) {
      if (!profile.favorites.includes(fav)) profile.favorites.push(fav);
    }
  }

  setRegionFilter(userEmail: string, region: string | null): void {
    const profile = this.getOrCreate(userEmail);
    profile.preferredRegion = region;
  }

  setDivisionFilter(userEmail: string, division: string | null): void {
    const profile = this.getOrCreate(userEmail);
    profile.preferredDivision = division;
  }

  clearNavProfile(userEmail: string): void {
    this.profiles.delete(userEmail);
  }

  private getOrCreate(userEmail: string): INavProfile {
    let profile = this.profiles.get(userEmail);
    if (!profile) {
      profile = defaultProfile();
      this.profiles.set(userEmail, profile);
    }
    return profile;
  }
}
