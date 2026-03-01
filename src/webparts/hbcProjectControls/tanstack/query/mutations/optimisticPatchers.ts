import type {
  IBuyoutEntry,
  IProjectManagementPlan,
  IEstimatingTracker,
  IEstimatingKickoff,
  IEstimatingKickoffItem,
  IPostBidAutopsy,
} from '@hbc/sp-services';

export function appendBuyoutEntryOptimistic(entries: IBuyoutEntry[], entry: IBuyoutEntry): IBuyoutEntry[] {
  return [...entries, entry].sort((a, b) => a.divisionCode.localeCompare(b.divisionCode));
}

export function replaceBuyoutEntryOptimistic(
  entries: IBuyoutEntry[],
  entryId: number,
  patch: Partial<IBuyoutEntry>
): IBuyoutEntry[] {
  return entries.map((entry) => (entry.id === entryId ? { ...entry, ...patch } : entry));
}

export function removeBuyoutEntryOptimistic(entries: IBuyoutEntry[], entryId: number): IBuyoutEntry[] {
  return entries.filter((entry) => entry.id !== entryId);
}

export function mergePmpOptimistic(
  current: IProjectManagementPlan | null,
  patch: Partial<IProjectManagementPlan>
): IProjectManagementPlan | null {
  if (!current) {
    return current;
  }

  const nextBoilerplate = patch.boilerplate
    ? current.boilerplate.map((section) =>
      patch.boilerplate?.find((candidate) => candidate.sectionNumber === section.sectionNumber) ?? section
    )
    : current.boilerplate;

  return {
    ...current,
    ...patch,
    boilerplate: nextBoilerplate,
    lastUpdatedAt: new Date().toISOString(),
  };
}

// ── Estimating Tracker Patchers (Phase 1 Task 1) ──────────────────────

export function patchEstimatingRecord(
  records: readonly IEstimatingTracker[],
  id: number,
  patch: Partial<IEstimatingTracker>,
): IEstimatingTracker[] {
  return records.map((r) => (r.id === id ? { ...r, ...patch } : r));
}

export function appendEstimatingRecord(
  records: readonly IEstimatingTracker[],
  record: IEstimatingTracker,
): IEstimatingTracker[] {
  return [record, ...records];
}

export function removeEstimatingRecord(
  records: readonly IEstimatingTracker[],
  id: number,
): IEstimatingTracker[] {
  return records.filter((r) => r.id !== id);
}

// ── Kickoff Patchers ──────────────────────────────────────────────────

export function patchKickoffItem(
  kickoff: IEstimatingKickoff,
  itemId: number,
  patch: Partial<IEstimatingKickoffItem>,
): IEstimatingKickoff {
  return {
    ...kickoff,
    items: kickoff.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
  };
}

export function removeKickoffItemOptimistic(
  kickoff: IEstimatingKickoff,
  itemId: number,
): IEstimatingKickoff {
  return {
    ...kickoff,
    items: kickoff.items.filter((i) => i.id !== itemId),
  };
}

export function mergeKickoffOptimistic(
  kickoff: IEstimatingKickoff,
  patch: Partial<IEstimatingKickoff>,
): IEstimatingKickoff {
  return { ...kickoff, ...patch };
}

// ── Post-Bid Autopsy Patchers ─────────────────────────────────────────

export function mergeAutopsyOptimistic(
  autopsy: IPostBidAutopsy,
  patch: Partial<IPostBidAutopsy>,
): IPostBidAutopsy {
  return {
    ...autopsy,
    ...patch,
    ModifiedDate: new Date().toISOString(),
  };
}
