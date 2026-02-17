import { IScheduleActivity, IScheduleMetrics } from '../models/IScheduleActivity';

/**
 * Compute full IScheduleMetrics from an array of schedule activities.
 * Shared across hook, MockDataService, and SharePointDataService.
 */
export function computeScheduleMetrics(activities: IScheduleActivity[]): IScheduleMetrics {
  const total = activities.length;
  const completedCount = activities.filter(a => a.status === 'Completed').length;
  const inProgressCount = activities.filter(a => a.status === 'In Progress').length;
  const notStartedCount = activities.filter(a => a.status === 'Not Started').length;
  const criticalActivityCount = activities.filter(a => a.isCritical).length;
  const negativeFloatCount = activities.filter(a => a.remainingFloat !== null && a.remainingFloat < 0).length;

  const floatsWithValues = activities.filter(a => a.remainingFloat !== null).map(a => a.remainingFloat!);
  const averageFloat = floatsWithValues.length > 0
    ? floatsWithValues.reduce((s, f) => s + f, 0) / floatsWithValues.length
    : 0;

  const percentComplete = total > 0
    ? Math.round((completedCount / total) * 100)
    : 0;

  // SPI approximation (basic)
  const totalDuration = activities.reduce((s, a) => s + a.originalDuration, 0);
  const earnedDurationBasic = activities.reduce((s, a) => s + a.actualDuration, 0);
  const spiApproximation = totalDuration > 0
    ? Math.round((earnedDurationBasic / totalDuration) * 100) / 100
    : null;

  // Float distribution
  const floatDistribution = {
    negative: negativeFloatCount,
    zero: activities.filter(a => a.remainingFloat === 0).length,
    low: activities.filter(a => a.remainingFloat !== null && a.remainingFloat > 0 && a.remainingFloat <= 10).length,
    medium: activities.filter(a => a.remainingFloat !== null && a.remainingFloat > 10 && a.remainingFloat <= 30).length,
    high: activities.filter(a => a.remainingFloat !== null && a.remainingFloat > 30).length,
  };

  // Negative float percent
  const negativeFloatPercent = total > 0 ? Math.round((negativeFloatCount / total) * 1000) / 10 : 0;

  // Earned value metrics
  const bac = totalDuration; // budget at completion = total original duration
  const ev = activities.reduce((s, a) => s + (a.percentComplete / 100) * a.originalDuration, 0);
  const actualDurationTotal = activities.reduce((s, a) => s + a.actualDuration, 0);

  // Planned value: sum of original durations for activities that should be done by now (baseline finish <= today)
  const today = new Date();
  const pv = activities.reduce((s, a) => {
    const baseFinish = a.baselineFinishDate ? new Date(a.baselineFinishDate) : null;
    if (baseFinish && baseFinish <= today) return s + a.originalDuration;
    if (!baseFinish) return s; // no baseline → 0 contribution
    // Partial: prorate based on baseline start
    const baseStart = a.baselineStartDate ? new Date(a.baselineStartDate) : null;
    if (baseStart && baseStart < today && baseFinish > today) {
      const totalSpan = baseFinish.getTime() - baseStart.getTime();
      const elapsed = today.getTime() - baseStart.getTime();
      if (totalSpan > 0) return s + a.originalDuration * (elapsed / totalSpan);
    }
    return s;
  }, 0);

  const sv = ev - pv;
  const evSpi = pv > 0 ? Math.round((ev / pv) * 100) / 100 : null;
  const evCpi = actualDurationTotal > 0 ? Math.round((ev / actualDurationTotal) * 100) / 100 : null;

  const earnedValueMetrics = {
    plannedDuration: Math.round(totalDuration * 10) / 10,
    earnedDuration: Math.round(ev * 10) / 10,
    actualDuration: Math.round(actualDurationTotal * 10) / 10,
    bac: Math.round(bac * 10) / 10,
    ev: Math.round(ev * 10) / 10,
    pv: Math.round(pv * 10) / 10,
    sv: Math.round(sv * 10) / 10,
    spi: evSpi,
    cpi: evCpi,
  };

  const cpiApproximation = evCpi;

  // Constraint analysis
  const constraintCounts: Record<string, number> = {};
  let totalConstrained = 0;
  for (const a of activities) {
    if (a.primaryConstraint && a.primaryConstraint.trim() !== '') {
      const key = a.primaryConstraint.trim();
      constraintCounts[key] = (constraintCounts[key] || 0) + 1;
      totalConstrained++;
    }
  }
  const constraintAnalysis = { totalConstrained, byType: constraintCounts };

  // Logic metrics
  let totalRelationships = 0;
  let totalPredCount = 0;
  let totalSuccCount = 0;
  let noSuccessor = 0;
  let noPredecessor = 0;
  const relTypeCounts: Record<string, number> = { FS: 0, FF: 0, SS: 0, SF: 0 };

  for (const a of activities) {
    totalPredCount += a.predecessors.length;
    totalSuccCount += a.successors.length;
    if (a.successors.length === 0) noSuccessor++;
    if (a.predecessors.length === 0) noPredecessor++;
    for (const sd of a.successorDetails) {
      totalRelationships++;
      const rt = sd.relationshipType;
      if (rt in relTypeCounts) relTypeCounts[rt]++;
      else relTypeCounts[rt] = 1;
    }
  }

  const logicMetrics = {
    totalRelationships,
    avgPredecessors: total > 0 ? Math.round((totalPredCount / total) * 10) / 10 : 0,
    avgSuccessors: total > 0 ? Math.round((totalSuccCount / total) * 10) / 10 : 0,
    openEnds: { noSuccessor, noPredecessor },
    relationshipTypes: relTypeCounts,
  };

  return {
    totalActivities: total,
    completedCount,
    inProgressCount,
    notStartedCount,
    percentComplete,
    criticalActivityCount,
    negativeFloatCount,
    averageFloat: Math.round(averageFloat * 10) / 10,
    spiApproximation,
    floatDistribution,
    negativeFloatPercent,
    cpiApproximation,
    constraintAnalysis,
    earnedValueMetrics,
    logicMetrics,
  };
}
