/**
 * IBambooHR — Models for BambooHR integration (Phase 4C).
 * Supports employee directory, time-off, org chart, and employee mapping.
 */

// ─── Employee ────────────────────────────────────────────────────────────────

export interface IBambooHREmployee {
  id: number;
  bambooId: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  division: string;
  supervisor: string;
  hireDate: string;
  photoUrl: string;
  workPhone: string;
  mobilePhone: string;
  status: 'Active' | 'Inactive';
}

// ─── Time Off ────────────────────────────────────────────────────────────────

export interface IBambooHRTimeOff {
  id: number;
  employeeId: number;
  type: string;
  startDate: string;
  endDate: string;
  status: 'Approved' | 'Pending' | 'Denied';
  hours: number;
}

// ─── Directory ───────────────────────────────────────────────────────────────

export interface IBambooHRDirectory {
  departments: Array<{
    name: string;
    employeeCount: number;
    divisions: string[];
  }>;
}

// ─── Employee Mapping ────────────────────────────────────────────────────────

export interface IBambooHREmployeeMapping {
  id: number;
  bambooId: string;
  hbcUserId: string;
  email: string;
  autoMapped: boolean;
  confirmedBy: string | null;
  confirmedAt: string | null;
}
