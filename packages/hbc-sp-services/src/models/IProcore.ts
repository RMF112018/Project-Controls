/**
 * IProcore — Models for Procore integration (Phase 4B).
 * Covers projects, RFIs, submittals, budget, change orders, daily logs, photos,
 * sync summaries, and conflict resolution.
 */

// ─── Projects ────────────────────────────────────────────────────────────────

export interface IProcoreProject {
  id: number;
  procoreId: number;
  name: string;
  status: string;
  address: string;
  startDate: string;
  completionDate: string;
  projectManager: string;
  client: string;
}

// ─── RFIs ────────────────────────────────────────────────────────────────────

export interface IProcoreRFI {
  id: number;
  procoreId: number;
  number: number;
  subject: string;
  status: string;
  assignee: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  hbcProjectCode: string;
}

// ─── Submittals ──────────────────────────────────────────────────────────────

export interface IProcoreSubmittal {
  id: number;
  procoreId: number;
  number: number;
  title: string;
  status: string;
  specSection: string;
  dueDate: string;
  responsibleContractor: string;
  hbcProjectCode: string;
}

// ─── Budget ──────────────────────────────────────────────────────────────────

export interface IProcoreBudgetLineItem {
  id: number;
  costCode: string;
  description: string;
  originalBudget: number;
  revisedBudget: number;
  commitments: number;
  pendingChanges: number;
  projectedCost: number;
  hbcProjectCode: string;
}

// ─── Change Orders ───────────────────────────────────────────────────────────

export interface IProcoreChangeOrder {
  id: number;
  number: number;
  title: string;
  status: string;
  amount: number;
  approvedDate: string;
  requestedBy: string;
  hbcProjectCode: string;
}

// ─── Daily Logs ──────────────────────────────────────────────────────────────

export interface IProcoreDailyLog {
  id: number;
  date: string;
  weather: string;
  crewCount: number;
  notes: string;
  createdBy: string;
  hbcProjectCode: string;
}

// ─── Photos ──────────────────────────────────────────────────────────────────

export interface IProcorePhoto {
  id: number;
  albumName: string;
  filename: string;
  url: string;
  takenAt: string;
  uploadedBy: string;
  hbcProjectCode: string;
}

// ─── Sync Summary ────────────────────────────────────────────────────────────

export interface IProcoreSyncSummary {
  lastSync: string | null;
  conflicts: number;
  stats: {
    projects: number;
    rfis: number;
    submittals: number;
    budget: number;
  };
}

// ─── Conflicts ───────────────────────────────────────────────────────────────

export interface IProcoreConflict {
  id: number;
  field: string;
  hbcValue: string;
  procoreValue: string;
  entityType: string;
  entityId: number;
  resolvedBy: string | null;
  resolution: 'pending' | 'hbc' | 'procore' | null;
  detectedAt: string;
}
