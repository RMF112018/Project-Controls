export interface ISectorDefinition {
  id: number;
  code: string;           // e.g., 'AIRPORT'
  label: string;          // e.g., 'Airport'
  isActive: boolean;
  parentDivision?: string; // For future subsidiaries
  sortOrder: number;
}
