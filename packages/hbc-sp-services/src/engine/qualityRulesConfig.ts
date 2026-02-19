export interface IQualityThresholdContext {
  totalActivities: number;
}

export interface IQualityRuleDefinition {
  id: string;
  name: string;
  weight: number;
  category: 'logic' | 'duration' | 'constraints' | 'float' | 'status' | 'relationships';
  threshold: (ctx: IQualityThresholdContext) => number;
}

export interface ICustomQualityRuleDefinition {
  id: string;
  name: string;
  weight: number;
  threshold: (ctx: IQualityThresholdContext) => number;
}

export interface IScheduleQualityConfig {
  dcmaRules: IQualityRuleDefinition[];
  customRules: ICustomQualityRuleDefinition[];
  customBlendWeight: number;
}

const pct = (ratio: number) => (ctx: IQualityThresholdContext): number => Math.max(1, Math.round(ctx.totalActivities * ratio));

export const DEFAULT_SCHEDULE_QUALITY_CONFIG: IScheduleQualityConfig = {
  // Logic-heavy weighting profile as approved.
  dcmaRules: [
    { id: 'dcma-01', name: 'Missing Logic', weight: 1.4, category: 'logic', threshold: pct(0.05) },
    { id: 'dcma-02', name: 'Leads Usage', weight: 1.2, category: 'relationships', threshold: pct(0.01) },
    { id: 'dcma-03', name: 'Lags Usage', weight: 1.2, category: 'relationships', threshold: pct(0.05) },
    { id: 'dcma-04', name: 'Relationship Type Quality', weight: 0.8, category: 'relationships', threshold: pct(0.1) },
    { id: 'dcma-05', name: 'Hard Constraints', weight: 1.1, category: 'constraints', threshold: pct(0.05) },
    { id: 'dcma-06', name: 'High Duration', weight: 0.7, category: 'duration', threshold: pct(0.05) },
    { id: 'dcma-07', name: 'Negative Float', weight: 1.1, category: 'float', threshold: pct(0.05) },
    { id: 'dcma-08', name: 'High Float', weight: 0.7, category: 'float', threshold: pct(0.05) },
    { id: 'dcma-09', name: 'Critical Density', weight: 0.9, category: 'float', threshold: pct(0.2) },
    { id: 'dcma-10', name: 'Invalid Dates', weight: 1.0, category: 'status', threshold: pct(0.01) },
    { id: 'dcma-11', name: 'Duplicate Logic', weight: 1.0, category: 'logic', threshold: pct(0.01) },
    { id: 'dcma-12', name: 'Orphan References', weight: 1.3, category: 'logic', threshold: pct(0.0) },
    { id: 'dcma-13', name: 'Open Ends Concentration', weight: 1.3, category: 'logic', threshold: pct(0.05) },
    { id: 'dcma-14', name: 'Progress Integrity', weight: 1.0, category: 'status', threshold: pct(0.02) },
  ],
  customRules: [
    { id: 'custom-01', name: 'Critical Activity Progress Lag', weight: 1.0, threshold: pct(0.1) },
    { id: 'custom-02', name: 'Resource Overload Risk', weight: 1.0, threshold: pct(0.1) },
  ],
  customBlendWeight: 0.2,
};
