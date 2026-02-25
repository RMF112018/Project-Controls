/**
 * Shared utilities for deterministic benchmark data generation.
 * Uses a seeded linear congruential generator (LCG) for reproducible output.
 */

export class SeededRandom {
  private seed: number;

  constructor(seed: number = 42) {
    this.seed = seed;
  }

  /** Returns a pseudo-random float in [0, 1). */
  next(): number {
    // LCG parameters (Numerical Recipes)
    this.seed = (this.seed * 1664525 + 1013904223) & 0xffffffff;
    return (this.seed >>> 0) / 0x100000000;
  }

  /** Returns a random integer in [min, max] (inclusive). */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Returns a random float in [min, max). */
  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /** Returns a random element from the array. */
  choice<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }

  /** Returns N random elements from the array (no duplicates). */
  sample<T>(arr: readonly T[], n: number): T[] {
    const copy = [...arr];
    const result: T[] = [];
    const count = Math.min(n, copy.length);
    for (let i = 0; i < count; i++) {
      const idx = this.int(0, copy.length - 1);
      result.push(copy[idx]);
      copy.splice(idx, 1);
    }
    return result;
  }

  /** Returns a random boolean with given probability of true. */
  bool(probability: number = 0.5): boolean {
    return this.next() < probability;
  }
}

/** Generate a random ISO date string within a range. */
export function randomDate(rng: SeededRandom, startYear: number, endYear: number): string {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  const ts = start + rng.next() * (end - start);
  return new Date(ts).toISOString();
}

/** Generate a random ISO date string (date only, no time). */
export function randomDateOnly(rng: SeededRandom, startYear: number, endYear: number): string {
  return randomDate(rng, startYear, endYear).split('T')[0];
}

/** Generate a random string of given length. */
export function randomString(rng: SeededRandom, length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[rng.int(0, chars.length - 1)];
  }
  return result;
}

/** Generate a project code like "25-042-01". */
export function randomProjectCode(rng: SeededRandom): string {
  const year = rng.int(24, 27);
  const seq = rng.int(1, 99).toString().padStart(3, '0');
  const phase = rng.int(1, 3).toString().padStart(2, '0');
  return `${year}-${seq}-${phase}`;
}

/** Realistic company names for construction. */
export const SUBCONTRACTOR_NAMES = [
  'Precision Survey Co.', 'GreenField Clearing Inc.', 'SunCoast Electrical',
  'Atlantic Plumbing Group', 'Gulf Stream Concrete', 'Palm Beach Steel Works',
  'Coastal Roofing Systems', 'TriCounty Fire Protection', 'South Florida Drywall',
  'Elite Glass & Glazing', 'Premier Mechanical Inc.', 'Metro Paving Corp.',
  'BayView Landscaping', 'Horizon Painting Services', 'AllState Elevator Co.',
  'Pacific Insulation Inc.', 'Heritage Masonry LLC', 'Pinnacle HVAC Systems',
  'Tropical Waterproofing', 'Foundation Specialists Inc.',
] as const;

/** CSI division codes. */
export const DIVISION_CODES = [
  '02-300', '02-310', '03-100', '03-300', '04-200', '05-100', '05-120',
  '06-100', '07-100', '07-200', '07-400', '08-100', '08-400', '09-100',
  '09-200', '09-300', '09-500', '09-900', '10-100', '14-200', '15-100',
  '15-300', '15-400', '16-100', '22-100', '23-100', '26-100', '28-100',
  '31-100', '32-100', '33-100',
] as const;

export const DIVISION_DESCRIPTIONS: Record<string, string> = {
  '02-300': 'Staking', '02-310': 'Site Clearing', '03-100': 'Concrete Formwork',
  '03-300': 'Cast-in-Place Concrete', '04-200': 'Unit Masonry', '05-100': 'Structural Steel',
  '05-120': 'Steel Joists', '06-100': 'Rough Carpentry', '07-100': 'Waterproofing',
  '07-200': 'Thermal Insulation', '07-400': 'Metal Roofing', '08-100': 'Doors & Frames',
  '08-400': 'Storefronts', '09-100': 'Metal Framing', '09-200': 'Plaster & Gypsum',
  '09-300': 'Tile Work', '09-500': 'Acoustical Ceilings', '09-900': 'Paint & Coatings',
  '10-100': 'Signage', '14-200': 'Elevators', '15-100': 'Plumbing',
  '15-300': 'Fire Protection', '15-400': 'HVAC', '16-100': 'Electrical',
  '22-100': 'Plumbing Systems', '23-100': 'HVAC Systems', '26-100': 'Electrical Systems',
  '28-100': 'Electronic Safety', '31-100': 'Earthwork', '32-100': 'Exterior Improvements',
  '33-100': 'Utilities',
};

/** User emails. */
export const USER_EMAILS = [
  'kfoster@hedrickbrothers.com', 'jrodriguez@hedrickbrothers.com',
  'smitchell@hedrickbrothers.com', 'mhenderson@hedrickbrothers.com',
  'jcollier@hedrickbrothers.com', 'admin@hedrickbrothers.com',
  'bdm@hedrickbrothers.com', 'pm@hedrickbrothers.com',
] as const;

/** Estimator names. */
export const ESTIMATOR_NAMES = ['Sam', 'Vito', 'Hank', 'Bill', 'Claudia', 'Frank', 'Diana'] as const;

/** Architect/Engineer firm names. */
export const AE_FIRMS = [
  'HKS Architects', 'Zyscovich Architects', 'Arquitectonica', 'TLC Engineering',
  'AECOM', 'Gensler', 'Perkins+Will', 'Kimley-Horn', 'WPL Interior Design',
  'Stantec', 'Smith+Gill Architecture',
] as const;

/** Client names. */
export const CLIENT_NAMES = [
  'Palm Beach Atlantic University', 'Brightline / Florida East Coast Industries',
  'Simon Property Group', 'Martin County Board of Commissioners',
  'Related Group', 'Kolter Urban', 'GL Homes', 'Mast Capital',
  'Lennar Corporation', 'Pulte Homes', 'City of West Palm Beach',
  'Palm Beach County', 'Broward County', 'MDM Development Group',
  'Trillist Companies', 'Flagler Global Logistics',
] as const;

/** WBS code prefixes for schedule activities. */
export const WBS_PREFIXES = [
  'SITEWORK', 'SITEUTLS', 'FNDS', 'STRUCT', 'ENCL', 'MEP',
  'INTFIN', 'EXTFIN', 'PUNCH', 'PRECON', 'CLOSEOUT',
] as const;

/** Activity name templates. */
export const ACTIVITY_TEMPLATES = [
  'MOBILIZATION', 'EXCAVATION', 'FOUNDATION WORK', 'SLAB ON GRADE',
  'STRUCTURAL STEEL ERECTION', 'METAL DECK', 'CONCRETE POUR',
  'MASONRY WALLS', 'ROOF STRUCTURE', 'WATERPROOFING', 'ROUGH-IN MEP',
  'FRAMING', 'DRYWALL', 'CEILING GRID', 'FLOOR TILE', 'PAINT',
  'MILLWORK INSTALL', 'ELEVATOR INSTALL', 'FIRE PROTECTION', 'LANDSCAPING',
  'PAVING', 'TESTING & INSPECTION', 'PUNCH LIST', 'FINAL CLEAN',
  'SUBSTANTIAL COMPLETION', 'FINAL COMPLETION',
] as const;
