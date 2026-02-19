import {
  IScheduleActivity,
  IScheduleFieldLink,
  IScheduleMetrics,
} from '../models/IScheduleActivity';
import {
  IScheduleCpmResult,
  IScheduleCpmActivityResult,
  IScheduleQualityReport,
  IScheduleDagDiagnostic,
  IForensicWindow,
  IForensicAnalysisResult,
  IMonteCarloConfig,
  IMonteCarloResult,
  IResourceLevelingResult,
  IScheduleEvmResult,
  IFieldReadinessScore,
} from '../models/IScheduleEngine';
import { IConstraintLog } from '../models/IConstraintLog';
import { IPermit } from '../models/IPermit';
import { computeScheduleMetrics } from '../utils/scheduleMetrics';

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

interface IIdentityNode {
  key: string;
  activity: IScheduleActivity;
}

export class ScheduleEngine {
  private assertExternalActivityKeys(activities: IScheduleActivity[]): Map<string, IIdentityNode> {
    const map = new Map<string, IIdentityNode>();
    for (const a of activities) {
      const key = a.externalActivityKey?.trim();
      if (!key) {
        throw new Error(`ScheduleEngine requires externalActivityKey for activity ${a.taskCode}`);
      }
      if (map.has(key)) {
        throw new Error(`Duplicate externalActivityKey detected: ${key}`);
      }
      map.set(key, { key, activity: a });
    }
    return map;
  }

  public analyzeDag(_projectCode: string, activities: IScheduleActivity[]): IScheduleDagDiagnostic {
    const nodes = this.assertExternalActivityKeys(activities);
    const taskToKey = new Map<string, string>();
    for (const a of activities) {
      const key = a.externalActivityKey?.trim();
      if (key) taskToKey.set(a.taskCode, key);
    }

    const incoming = new Map<string, Set<string>>();
    const outgoing = new Map<string, Set<string>>();
    const orphanReferences: IScheduleDagDiagnostic['orphanReferences'] = [];
    const duplicatePredecessors: IScheduleDagDiagnostic['duplicatePredecessors'] = [];

    nodes.forEach((_, key) => {
      incoming.set(key, new Set<string>());
      outgoing.set(key, new Set<string>());
    });

    nodes.forEach(({ key, activity }) => {
      const seenPredTaskCodes = new Set<string>();
      const duplicates = new Set<string>();
      for (const predTaskCode of activity.predecessors) {
        if (seenPredTaskCodes.has(predTaskCode)) {
          duplicates.add(predTaskCode);
        }
        seenPredTaskCodes.add(predTaskCode);

        const predKey = taskToKey.get(predTaskCode);
        if (!predKey || !nodes.has(predKey)) {
          orphanReferences.push({ activityKey: key, missingRefTaskCode: predTaskCode, refType: 'pred' });
          continue;
        }
        incoming.get(key)?.add(predKey);
        outgoing.get(predKey)?.add(key);
      }
      if (duplicates.size > 0) {
        duplicatePredecessors.push({ activityKey: key, duplicateTaskCodes: Array.from(duplicates) });
      }
      for (const succTaskCode of activity.successors) {
        if (!taskToKey.has(succTaskCode)) {
          orphanReferences.push({ activityKey: key, missingRefTaskCode: succTaskCode, refType: 'succ' });
        }
      }
    });

    const indegree = new Map<string, number>();
    incoming.forEach((set, key) => indegree.set(key, set.size));
    const queue = Array.from(indegree.entries()).filter(([, n]) => n === 0).map(([k]) => k).sort();
    let processed = 0;
    const indegreeWorking = new Map(indegree);
    while (queue.length > 0) {
      const key = queue.shift() as string;
      processed++;
      const nextNodes = Array.from(outgoing.get(key) || []).sort();
      for (const next of nextNodes) {
        const nextDegree = (indegreeWorking.get(next) || 0) - 1;
        indegreeWorking.set(next, nextDegree);
        if (nextDegree === 0) queue.push(next);
      }
    }
    const hasCycle = processed !== activities.length;

    const cyclePaths: string[][] = [];
    if (hasCycle) {
      // DFS back-edge extraction (best-effort paths)
      const visiting = new Set<string>();
      const visited = new Set<string>();
      const stack: string[] = [];
      const dfs = (node: string): void => {
        visiting.add(node);
        stack.push(node);
        for (const next of outgoing.get(node) || []) {
          if (visited.has(next)) continue;
          if (visiting.has(next)) {
            const idx = stack.indexOf(next);
            if (idx >= 0) cyclePaths.push(stack.slice(idx).concat(next));
            continue;
          }
          dfs(next);
        }
        stack.pop();
        visiting.delete(node);
        visited.add(node);
      };
      for (const key of nodes.keys()) {
        if (!visited.has(key)) dfs(key);
      }
    }

    const noPred = Array.from(nodes.keys()).filter(key => (incoming.get(key)?.size || 0) === 0);
    const noSucc = Array.from(nodes.keys()).filter(key => (outgoing.get(key)?.size || 0) === 0);
    const edgeCount = Array.from(outgoing.values()).reduce((sum, set) => sum + set.size, 0);

    return {
      hasCycle,
      cyclePaths,
      openEndNodes: { noPred, noSucc },
      orphanReferences,
      duplicatePredecessors,
      nodeCount: nodes.size,
      edgeCount,
    };
  }

  public runCpm(projectCode: string, activities: IScheduleActivity[]): IScheduleCpmResult {
    const nodes = this.assertExternalActivityKeys(activities);
    const diagnostic = this.analyzeDag(projectCode, activities);
    const warnings: string[] = diagnostic.orphanReferences
      .filter(r => r.refType === 'pred')
      .map(r => `Missing predecessor mapping for ${r.activityKey} -> ${r.missingRefTaskCode}`);
    if (diagnostic.hasCycle) {
      throw new Error(`CPM graph contains cycle(s): ${JSON.stringify(diagnostic.cyclePaths.slice(0, 3))}`);
    }

    const taskToKey = new Map<string, string>();
    activities.forEach(a => {
      const key = a.externalActivityKey?.trim();
      if (key) taskToKey.set(a.taskCode, key);
    });
    const incoming = new Map<string, Set<string>>();
    const outgoing = new Map<string, Set<string>>();
    nodes.forEach((_, key) => {
      incoming.set(key, new Set<string>());
      outgoing.set(key, new Set<string>());
    });

    nodes.forEach(({ key, activity }) => {
      for (const predTaskCode of activity.predecessors) {
        const predKey = taskToKey.get(predTaskCode);
        if (!predKey || !nodes.has(predKey)) {
          continue;
        }
        incoming.get(key)?.add(predKey);
        outgoing.get(predKey)?.add(key);
      }
    });

    const indegree = new Map<string, number>();
    incoming.forEach((set, key) => indegree.set(key, set.size));
    const queue = Array.from(indegree.entries()).filter(([, n]) => n === 0).map(([k]) => k);
    const topo: string[] = [];
    while (queue.length > 0) {
      const key = queue.shift() as string;
      topo.push(key);
      for (const next of outgoing.get(key) || []) {
        const left = (indegree.get(next) || 0) - 1;
        indegree.set(next, left);
        if (left === 0) queue.push(next);
      }
    }
    if (topo.length !== activities.length) throw new Error('CPM topo ordering failed');

    const earlyStart = new Map<string, number>();
    const earlyFinish = new Map<string, number>();
    for (const key of topo) {
      const preds = Array.from(incoming.get(key) || []);
      const es = preds.length === 0 ? 0 : Math.max(...preds.map(p => earlyFinish.get(p) || 0));
      const dur = Math.max(0, nodes.get(key)?.activity.originalDuration || 0);
      earlyStart.set(key, es);
      earlyFinish.set(key, es + dur);
    }

    const projectDuration = Math.max(0, ...Array.from(earlyFinish.values()));
    const lateFinish = new Map<string, number>();
    const lateStart = new Map<string, number>();
    for (const key of [...topo].reverse()) {
      const succ = Array.from(outgoing.get(key) || []);
      const lf = succ.length === 0 ? projectDuration : Math.min(...succ.map(s => lateStart.get(s) || projectDuration));
      const dur = Math.max(0, nodes.get(key)?.activity.originalDuration || 0);
      lateFinish.set(key, lf);
      lateStart.set(key, lf - dur);
    }

    const results: IScheduleCpmActivityResult[] = topo.map(key => {
      const es = earlyStart.get(key) || 0;
      const ef = earlyFinish.get(key) || 0;
      const ls = lateStart.get(key) || 0;
      const lf = lateFinish.get(key) || 0;
      const totalFloat = ls - es;
      const succ = Array.from(outgoing.get(key) || []);
      const freeFloat = succ.length === 0 ? totalFloat : Math.min(...succ.map(s => (earlyStart.get(s) || 0) - ef));
      return {
        externalActivityKey: key,
        earlyStartDay: es,
        earlyFinishDay: ef,
        lateStartDay: ls,
        lateFinishDay: lf,
        totalFloatDays: totalFloat,
        freeFloatDays: freeFloat,
        isCritical: totalFloat <= 0,
      };
    });

    return {
      projectCode,
      generatedAt: new Date().toISOString(),
      projectDurationDays: projectDuration,
      criticalPathExternalKeys: results.filter(r => r.isCritical).map(r => r.externalActivityKey),
      activities: results,
      warnings,
      diagnostic,
    };
  }

  public runScheduleQualityChecks(projectCode: string, activities: IScheduleActivity[]): IScheduleQualityReport {
    this.assertExternalActivityKeys(activities);
    const metrics = computeScheduleMetrics(activities);
    const checks = [
      {
        id: 'dcma-01',
        name: 'Missing Logic',
        value: metrics.logicMetrics.openEnds.noPredecessor + metrics.logicMetrics.openEnds.noSuccessor,
        threshold: Math.max(1, Math.round(metrics.totalActivities * 0.05)),
      },
      {
        id: 'dcma-02',
        name: 'High Negative Float',
        value: metrics.negativeFloatCount,
        threshold: Math.max(1, Math.round(metrics.totalActivities * 0.05)),
      },
      {
        id: 'dcma-03',
        name: 'Excessive Critical Density',
        value: metrics.criticalActivityCount,
        threshold: Math.max(1, Math.round(metrics.totalActivities * 0.2)),
      },
    ];

    const dcmaChecks = checks.map(c => ({
      id: c.id,
      name: c.name,
      value: c.value,
      threshold: c.threshold,
      passed: c.value <= c.threshold,
      details: `${c.name}: ${c.value} (threshold ${c.threshold})`,
    }));

    const remediationSteps = dcmaChecks
      .filter(c => !c.passed)
      .map(c => `Investigate and remediate ${c.name.toLowerCase()}.`);
    const passCount = dcmaChecks.filter(c => c.passed).length;
    const overallScore = Math.round((passCount / dcmaChecks.length) * 100);

    return {
      projectCode,
      generatedAt: new Date().toISOString(),
      overallScore,
      dcmaChecks,
      remediationSteps,
    };
  }

  public runForensicAnalysis(projectCode: string, windows: IForensicWindow[]): IForensicAnalysisResult {
    const mapped = windows.map(w => ({
      windowId: w.id,
      windowName: w.name,
      attributableDelayDays: Math.max(0, w.fragnetDelayDays),
    }));
    return {
      projectCode,
      generatedAt: new Date().toISOString(),
      totalAnalyzedDelayDays: mapped.reduce((sum, w) => sum + w.attributableDelayDays, 0),
      windows: mapped,
    };
  }

  public runMonteCarlo(projectCode: string, activities: IScheduleActivity[], config: IMonteCarloConfig): IMonteCarloResult {
    this.assertExternalActivityKeys(activities);
    const iterations = Math.max(1, config.iterations || 1000);
    const rand = seededRandom(config.seed ?? 1337);
    const base = activities.reduce((sum, a) => sum + Math.max(0, a.originalDuration), 0);
    const samples: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const noise = 0.85 + rand() * 0.35;
      samples.push(base * noise);
    }
    samples.sort((a, b) => a - b);
    const percentile = (p: number): number => Math.round(samples[Math.min(samples.length - 1, Math.floor(samples.length * p))]);
    const p50 = percentile(0.5);
    const p80 = percentile(0.8);
    const p95 = percentile(0.95);
    const sCurve = samples
      .filter((_, idx) => idx % Math.max(1, Math.floor(samples.length / 40)) === 0)
      .map((value, idx, arr) => ({ finishDay: Math.round(value), cumulativeProbability: Math.round(((idx + 1) / arr.length) * 1000) / 10 }));

    const tornado = activities
      .slice(0, 10)
      .map(a => ({
        externalActivityKey: a.externalActivityKey as string,
        impactDays: Math.round(Math.max(1, a.originalDuration * 0.1)),
      }))
      .sort((a, b) => b.impactDays - a.impactDays);

    return {
      projectCode,
      iterations,
      p50FinishDay: p50,
      p80FinishDay: p80,
      p95FinishDay: p95,
      sCurve,
      tornado,
    };
  }

  public runResourceLeveling(projectCode: string, activities: IScheduleActivity[]): IResourceLevelingResult {
    this.assertExternalActivityKeys(activities);
    const overallocated = activities.filter(a => a.resources.split(',').map(r => r.trim()).filter(Boolean).length > 4).length;
    const recommendations: string[] = [];
    if (overallocated > 0) {
      recommendations.push('Shift non-critical activities with high resource overlap.');
      recommendations.push('Introduce staggered crew starts for dense WBS segments.');
    } else {
      recommendations.push('No significant overallocation detected in current snapshot.');
    }
    return {
      projectCode,
      generatedAt: new Date().toISOString(),
      overallocatedResourceCount: overallocated,
      recommendations,
    };
  }

  public computeEvm(projectCode: string, metrics: IScheduleMetrics): IScheduleEvmResult {
    const ev = metrics.earnedValueMetrics.ev;
    const pv = metrics.earnedValueMetrics.pv;
    const ac = metrics.earnedValueMetrics.actualDuration;
    const bac = metrics.earnedValueMetrics.bac;
    const sv = ev - pv;
    const cv = ev - ac;
    return {
      projectCode,
      bac,
      ev,
      pv,
      ac,
      sv,
      cv,
      spi: pv > 0 ? Math.round((ev / pv) * 100) / 100 : null,
      cpi: ac > 0 ? Math.round((ev / ac) * 100) / 100 : null,
      generatedAt: new Date().toISOString(),
    };
  }

  public computeFieldReadinessScore(
    projectCode: string,
    activities: IScheduleActivity[],
    links: IScheduleFieldLink[],
    constraints: IConstraintLog[],
    permits: IPermit[],
  ): IFieldReadinessScore {
    const identifiable = activities.filter(a => !!a.externalActivityKey).length;
    const linkedKeys = new Set(links.map(l => l.externalActivityKey).filter(Boolean));
    const linkageCoveragePct = identifiable > 0 ? Math.round((linkedKeys.size / identifiable) * 1000) / 10 : 0;
    const ppcProxy = activities.length > 0
      ? Math.round((activities.filter(a => a.status === 'Completed').length / activities.length) * 1000) / 10
      : 0;

    const openConstraints = constraints.filter(c => c.status === 'Open').length;
    const openConstraintPenalty = constraints.length > 0 ? Math.round((openConstraints / constraints.length) * 1000) / 10 : 0;

    const unresolvedPermits = permits.filter(p => p.status !== 'Closed').length;
    const openPermitPenalty = permits.length > 0 ? Math.round((unresolvedPermits / permits.length) * 1000) / 10 : 0;

    const scoreRaw =
      (0.5 * linkageCoveragePct) +
      (0.25 * ppcProxy) +
      (0.15 * (100 - openConstraintPenalty)) +
      (0.1 * (100 - openPermitPenalty));
    const score = Math.max(0, Math.min(100, Math.round(scoreRaw * 10) / 10));

    return {
      projectCode,
      score,
      linkageCoveragePct,
      ppcProxy,
      openConstraintPenalty,
      openPermitPenalty,
      computedAt: new Date().toISOString(),
    };
  }
}
