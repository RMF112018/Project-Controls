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
  IDcmaCheckResult,
  IQualityRuleResult,
  IQualityRemediationSuggestion,
  IQualityExportRow,
  IQualityActivityPatch,
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
import {
  DEFAULT_SCHEDULE_QUALITY_CONFIG,
  IScheduleQualityConfig,
  IQualityRuleDefinition,
} from './qualityRulesConfig';

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
  private readonly qualityConfig: IScheduleQualityConfig;

  public constructor(config: Partial<IScheduleQualityConfig> = {}) {
    this.qualityConfig = {
      ...DEFAULT_SCHEDULE_QUALITY_CONFIG,
      ...config,
      dcmaRules: config.dcmaRules ?? DEFAULT_SCHEDULE_QUALITY_CONFIG.dcmaRules,
      customRules: config.customRules ?? DEFAULT_SCHEDULE_QUALITY_CONFIG.customRules,
    };
  }

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

  private evaluateDcmaRule(
    def: IQualityRuleDefinition,
    activities: IScheduleActivity[],
    metrics: IScheduleMetrics,
    dag: IScheduleDagDiagnostic,
  ): IDcmaCheckResult {
    const total = Math.max(1, activities.length);
    const lagLinks = activities.flatMap(a => a.successorDetails || []).filter(d => (d.lag || 0) > 0).length;
    const leadLinks = activities.flatMap(a => a.successorDetails || []).filter(d => (d.lag || 0) < 0).length;
    const nonFsLinks = activities.flatMap(a => a.successorDetails || []).filter(d => d.relationshipType !== 'FS').length;
    const totalLinks = activities.flatMap(a => a.successorDetails || []).length;
    const hardConstrained = activities.filter(a => (a.primaryConstraint || '').trim().length > 0 || (a.secondaryConstraint || '').trim().length > 0);
    const longDuration = activities.filter(a => a.originalDuration > 44);
    const highFloat = activities.filter(a => (a.remainingFloat ?? 0) > 44);
    const invalidDates = activities.filter(a => {
      const s = a.plannedStartDate ? new Date(a.plannedStartDate).getTime() : NaN;
      const f = a.plannedFinishDate ? new Date(a.plannedFinishDate).getTime() : NaN;
      if (Number.isNaN(s) || Number.isNaN(f)) return true;
      return f < s;
    });
    const dupPreds = dag.duplicatePredecessors.flatMap(d => d.duplicateTaskCodes.map(() => d.activityKey));
    const orphans = dag.orphanReferences.map(o => o.activityKey);
    const openEndKeys = Array.from(new Set([...dag.openEndNodes.noPred, ...dag.openEndNodes.noSucc]));
    const progressIntegrity = activities.filter(a => (
      (a.status === 'Completed' && a.percentComplete < 100) ||
      (a.status !== 'Completed' && a.percentComplete === 100) ||
      (a.status === 'In Progress' && !a.actualStartDate)
    ));
    const criticalNotStarted = activities.filter(a => a.isCritical && a.status === 'Not Started');
    const heavyResource = activities.filter(a => a.resources.split(',').map(r => r.trim()).filter(Boolean).length > 4);

    let value = 0;
    let failedActivityKeys: string[] = [];
    let details = '';
    switch (def.id) {
      case 'dcma-01':
        value = metrics.logicMetrics.openEnds.noPredecessor + metrics.logicMetrics.openEnds.noSuccessor;
        failedActivityKeys = openEndKeys;
        details = 'Activities without predecessor or successor relationships.';
        break;
      case 'dcma-02':
        value = leadLinks;
        failedActivityKeys = activities.filter(a => (a.successorDetails || []).some(d => (d.lag || 0) < 0)).map(a => a.externalActivityKey as string);
        details = 'Relationship leads in successor links.';
        break;
      case 'dcma-03':
        value = lagLinks;
        failedActivityKeys = activities.filter(a => (a.successorDetails || []).some(d => (d.lag || 0) > 0)).map(a => a.externalActivityKey as string);
        details = 'Relationship lags in successor links.';
        break;
      case 'dcma-04':
        value = totalLinks === 0 ? 0 : Math.round((nonFsLinks / totalLinks) * 100);
        failedActivityKeys = activities.filter(a => (a.successorDetails || []).some(d => d.relationshipType !== 'FS')).map(a => a.externalActivityKey as string);
        details = 'Non-FS relationship ratio.';
        break;
      case 'dcma-05':
        value = hardConstrained.length;
        failedActivityKeys = hardConstrained.map(a => a.externalActivityKey as string);
        details = 'Hard or secondary constraints assigned.';
        break;
      case 'dcma-06':
        value = longDuration.length;
        failedActivityKeys = longDuration.map(a => a.externalActivityKey as string);
        details = 'Activities exceeding 44 working days.';
        break;
      case 'dcma-07':
        value = metrics.negativeFloatCount;
        failedActivityKeys = activities.filter(a => (a.remainingFloat ?? 0) < 0).map(a => a.externalActivityKey as string);
        details = 'Activities with negative float.';
        break;
      case 'dcma-08':
        value = highFloat.length;
        failedActivityKeys = highFloat.map(a => a.externalActivityKey as string);
        details = 'Activities with excessive float (>44 days).';
        break;
      case 'dcma-09':
        value = metrics.criticalActivityCount;
        failedActivityKeys = activities.filter(a => a.isCritical).map(a => a.externalActivityKey as string);
        details = 'Critical activity density.';
        break;
      case 'dcma-10':
        value = invalidDates.length;
        failedActivityKeys = invalidDates.map(a => a.externalActivityKey as string);
        details = 'Invalid or reversed planned start/finish dates.';
        break;
      case 'dcma-11':
        value = dupPreds.length;
        failedActivityKeys = dupPreds;
        details = 'Duplicate predecessor references.';
        break;
      case 'dcma-12':
        value = orphans.length;
        failedActivityKeys = orphans;
        details = 'Orphan predecessor/successor references.';
        break;
      case 'dcma-13':
        value = openEndKeys.length;
        failedActivityKeys = openEndKeys;
        details = 'Open-end concentration across network.';
        break;
      case 'dcma-14':
        value = progressIntegrity.length;
        failedActivityKeys = progressIntegrity.map(a => a.externalActivityKey as string);
        details = 'Progress and status/date integrity mismatches.';
        break;
      default:
        value = 0;
        failedActivityKeys = [];
        details = 'Rule not configured.';
        break;
    }
    const threshold = def.threshold({ totalActivities: total });
    const passed = value <= threshold;
    return {
      id: def.id,
      name: def.name,
      passed,
      value,
      threshold,
      weight: def.weight,
      category: def.category,
      details: `${details} Value ${value} (threshold ${threshold}).`,
      failedActivityKeys,
    };
  }

  private buildRemediationSuggestions(
    projectCode: string,
    activities: IScheduleActivity[],
    failedChecks: IDcmaCheckResult[],
  ): IQualityRemediationSuggestion[] {
    const mapByKey = new Map<string, IScheduleActivity>(activities.map(a => [a.externalActivityKey as string, a]));
    const sorted = [...activities].sort((a, b) => {
      const aStart = a.plannedStartDate ? new Date(a.plannedStartDate).getTime() : 0;
      const bStart = b.plannedStartDate ? new Date(b.plannedStartDate).getTime() : 0;
      return aStart - bStart;
    });
    const suggestions: IQualityRemediationSuggestion[] = [];
    for (const check of failedChecks) {
      const keys = Array.from(new Set(check.failedActivityKeys)).slice(0, 30);
      const patches: IQualityActivityPatch[] = [];
      keys.forEach((key) => {
        const activity = mapByKey.get(key);
        if (!activity) return;
        if (check.id === 'dcma-05') {
          patches.push({ externalActivityKey: key, patch: { primaryConstraint: '', secondaryConstraint: '' } });
        } else if (check.id === 'dcma-06') {
          patches.push({ externalActivityKey: key, patch: { originalDuration: Math.min(activity.originalDuration, 44), remainingDuration: Math.min(activity.remainingDuration, 44) } });
        } else if (check.id === 'dcma-14') {
          const forceComplete = activity.status === 'Completed';
          patches.push({ externalActivityKey: key, patch: { percentComplete: forceComplete ? 100 : Math.min(99, Math.max(0, activity.percentComplete)) } });
        } else if (check.id === 'dcma-13' || check.id === 'dcma-01') {
          const idx = sorted.findIndex(s => s.externalActivityKey === key);
          if (idx > 0) {
            const pred = sorted[idx - 1];
            if (!activity.predecessors.includes(pred.taskCode)) {
              patches.push({
                externalActivityKey: key,
                patch: { predecessors: [...activity.predecessors, pred.taskCode] },
              });
            }
          }
        }
      });
      if (patches.length === 0) continue;
      const projected = activities.map(a => ({ ...a }));
      patches.forEach(p => {
        const row = projected.find(a => a.externalActivityKey === p.externalActivityKey);
        if (row) Object.assign(row, p.patch);
      });
      let cpCompressionDays = 0;
      let avgFloatImprovementDays = 0;
      let confidence: 'low' | 'medium' | 'high' = 'low';
      try {
        const baseCpm = this.runCpm(projectCode, activities);
        const projectedCpm = this.runCpm(projectCode, projected);
        cpCompressionDays = Math.max(0, baseCpm.projectDurationDays - projectedCpm.projectDurationDays);
        const baseFloat = baseCpm.activities.reduce((sum, row) => sum + row.totalFloatDays, 0);
        const nextFloat = projectedCpm.activities.reduce((sum, row) => sum + row.totalFloatDays, 0);
        avgFloatImprovementDays = Math.round(((nextFloat - baseFloat) / Math.max(1, projectedCpm.activities.length)) * 10) / 10;
        confidence = cpCompressionDays > 0 || avgFloatImprovementDays > 0 ? 'high' : 'medium';
      } catch {
        confidence = 'low';
      }
      suggestions.push({
        id: `${check.id}-rem-${suggestions.length + 1}`,
        ruleId: check.id,
        title: `Remediate ${check.name}`,
        description: `Targeted correction for ${check.name.toLowerCase()} findings.`,
        severity: check.value > check.threshold * 2 ? 'high' : check.value > check.threshold ? 'medium' : 'low',
        targetActivityKeys: keys,
        activityPatches: patches,
        estimatedImpact: {
          cpCompressionDays,
          avgFloatImprovementDays,
          confidence,
        },
      });
    }
    return suggestions;
  }

  public runScheduleQualityChecks(projectCode: string, activities: IScheduleActivity[]): IScheduleQualityReport {
    this.assertExternalActivityKeys(activities);
    const metrics = computeScheduleMetrics(activities);
    const dag = this.analyzeDag(projectCode, activities);
    const dcmaChecks = this.qualityConfig.dcmaRules.map(rule => this.evaluateDcmaRule(rule, activities, metrics, dag));
    const customRuleResults: IQualityRuleResult[] = this.qualityConfig.customRules.map(rule => {
      let value = 0;
      let failedActivityKeys: string[] = [];
      if (rule.id === 'custom-01') {
        const laggers = activities.filter(a => a.isCritical && a.status !== 'Completed' && a.percentComplete < 25);
        value = laggers.length;
        failedActivityKeys = laggers.map(a => a.externalActivityKey as string);
      } else if (rule.id === 'custom-02') {
        const overloaded = activities.filter(a => a.resources.split(',').map(r => r.trim()).filter(Boolean).length > 4);
        value = overloaded.length;
        failedActivityKeys = overloaded.map(a => a.externalActivityKey as string);
      }
      const threshold = rule.threshold({ totalActivities: Math.max(1, activities.length) });
      return {
        id: rule.id,
        name: rule.name,
        passed: value <= threshold,
        value,
        threshold,
        weight: rule.weight,
        details: `${rule.name}: ${value} (threshold ${threshold}).`,
        failedActivityKeys,
      };
    });

    const weightedScore = <T extends { passed: boolean; weight: number }>(rows: T[]): number => {
      const weightTotal = rows.reduce((sum, row) => sum + row.weight, 0);
      if (weightTotal <= 0) return 100;
      const passWeight = rows.reduce((sum, row) => sum + (row.passed ? row.weight : 0), 0);
      return Math.round((passWeight / weightTotal) * 1000) / 10;
    };

    const dcmaScore = weightedScore(dcmaChecks);
    const customRuleScore = weightedScore(customRuleResults);
    const overallScore = Math.round(((dcmaScore * (1 - this.qualityConfig.customBlendWeight)) + (customRuleScore * this.qualityConfig.customBlendWeight)) * 10) / 10;
    const failedDcma = dcmaChecks.filter(c => !c.passed);
    const remediationSuggestions = this.buildRemediationSuggestions(projectCode, activities, failedDcma);
    const remediationSteps = remediationSuggestions.map(s => `${s.title}: ${s.description}`);

    const dcmaExportRows = dcmaChecks.map<IQualityExportRow>(check => ({
      section: 'DCMA',
      id: check.id,
      name: check.name,
      passed: check.passed,
      score: check.passed ? 100 : 0,
      value: check.value,
      threshold: check.threshold,
      weight: check.weight,
      details: check.details,
      targetCount: check.failedActivityKeys.length,
    }));

    const customExportRows = customRuleResults.map<IQualityExportRow>(check => ({
      section: 'Custom',
      id: check.id,
      name: check.name,
      passed: check.passed,
      score: check.passed ? 100 : 0,
      value: check.value,
      threshold: check.threshold,
      weight: check.weight,
      details: check.details,
      targetCount: check.failedActivityKeys.length,
    }));

    const remediationExportRows = remediationSuggestions.map<IQualityExportRow>(s => ({
      section: 'Remediation',
      id: s.id,
      name: s.title,
      details: `${s.description} CP compression ${s.estimatedImpact.cpCompressionDays}d, float delta ${s.estimatedImpact.avgFloatImprovementDays}d.`,
      targetCount: s.targetActivityKeys.length,
    }));

    const exportRows: IQualityExportRow[] = [
      ...dcmaExportRows,
      ...customExportRows,
      ...remediationExportRows,
    ];

    return {
      projectCode,
      generatedAt: new Date().toISOString(),
      overallScore,
      dcmaScore,
      customRuleScore,
      scoreBreakdown: {
        dcmaScore,
        customRuleScore,
        overallScore,
      },
      dcmaChecks,
      customRuleResults,
      remediationSuggestions,
      exportRows,
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
