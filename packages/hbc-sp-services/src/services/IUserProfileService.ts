export interface INavProfile {
  favorites: string[];  // projectCodes
  recent: string[];     // projectCodes, max 5 FIFO
  preferredRegion?: string | null;
  preferredDivision?: string | null;
}

export interface IUserProfileService {
  getNavProfile(userEmail: string): INavProfile;
  addRecent(userEmail: string, projectCode: string): void;
  toggleFavorite(userEmail: string, projectCode: string): void;
  isFavorite(userEmail: string, projectCode: string): boolean;
  reorderFavorites(userEmail: string, orderedCodes: string[]): void;
  setRegionFilter(userEmail: string, region: string | null): void;
  setDivisionFilter(userEmail: string, division: string | null): void;
  clearNavProfile(userEmail: string): void;
}
