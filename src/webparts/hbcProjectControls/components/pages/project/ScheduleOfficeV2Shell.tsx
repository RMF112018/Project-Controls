import * as React from 'react';
import {
  IFieldReadinessScore,
  IScheduleActivity,
  IScheduleEngineRuntimeInfo,
  IScheduleScenario,
  IResourceLevelingResult,
  IPortfolioScheduleHealth,
} from '@hbc/sp-services';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../../shared/ToastContainer';
import { InteractiveGanttV2 } from './InteractiveGanttV2';
import { WhatIfSandbox } from './WhatIfSandbox';
import { ResourceManagement } from './ResourceManagement';
import { PortfolioScheduleDashboard } from './PortfolioScheduleDashboard';
import { ScheduleQualityWorkbench } from './ScheduleQualityWorkbench';
import { HBC_COLORS } from '../../../theme/tokens';

interface IScheduleOfficeV2ShellProps {
  projectCode: string;
  activities: IScheduleActivity[];
  section: 'gantt-v2' | 'what-if' | 'resources' | 'portfolio' | 'quality';
}

export const ScheduleOfficeV2Shell: React.FC<IScheduleOfficeV2ShellProps> = ({ projectCode, activities, section }) => {
  const { dataService, currentUser } = useAppContext();
  const { addToast } = useToast();
  const [fieldReadiness, setFieldReadiness] = React.useState<IFieldReadinessScore | null>(null);
  const [runtimeInfo, setRuntimeInfo] = React.useState<IScheduleEngineRuntimeInfo | null>(null);
  const [scenarios, setScenarios] = React.useState<IScheduleScenario[]>([]);
  const [leveling, setLeveling] = React.useState<IResourceLevelingResult | null>(null);
  const [portfolioRows, setPortfolioRows] = React.useState<IPortfolioScheduleHealth[]>([]);
  const [portfolioReadiness, setPortfolioReadiness] = React.useState<IFieldReadinessScore[]>([]);

  const refresh = React.useCallback(async () => {
    try {
      const [fr, runtime, scenarioRows, levelingResult, portfolio, readiness] = await Promise.all([
        dataService.computeFieldReadinessScore(projectCode),
        dataService.getScheduleEngineRuntimeInfo(),
        dataService.listScheduleScenarios(projectCode),
        dataService.runResourceLeveling(projectCode, activities),
        dataService.getPortfolioScheduleHealth(),
        dataService.getPortfolioFieldReadiness(),
      ]);
      setFieldReadiness(fr);
      setRuntimeInfo(runtime);
      setScenarios(scenarioRows);
      setLeveling(levelingResult);
      setPortfolioRows(portfolio);
      setPortfolioReadiness(readiness);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed loading office v2 data', 'error');
    }
  }, [activities, addToast, dataService, projectCode]);

  React.useEffect(() => {
    if (!projectCode) return;
    refresh().catch(() => undefined);
  }, [projectCode, refresh]);

  const createScenario = React.useCallback(async (name: string) => {
    await dataService.createScheduleScenario(projectCode, name, currentUser?.email || 'unknown');
    addToast(`Scenario "${name}" created`, 'success');
    await refresh();
  }, [addToast, currentUser?.email, dataService, projectCode, refresh]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {section === 'gantt-v2' && (
        <InteractiveGanttV2
          projectCode={projectCode}
          activities={activities}
          fieldReadiness={fieldReadiness}
          onFieldReadinessRefresh={() => refresh().catch(() => undefined)}
        />
      )}
      {section === 'what-if' && (
        <WhatIfSandbox scenarios={scenarios} onCreateScenario={createScenario} />
      )}
      {section === 'resources' && (
        <ResourceManagement leveling={leveling} runtimeInfo={runtimeInfo} />
      )}
      {section === 'portfolio' && (
        <PortfolioScheduleDashboard healthRows={portfolioRows} fieldReadinessRows={portfolioReadiness} />
      )}
      {section === 'quality' && (
        <ScheduleQualityWorkbench
          projectCode={projectCode}
          activities={activities}
          onFieldReadinessRefresh={() => refresh().catch(() => undefined)}
        />
      )}
      {runtimeInfo?.fallbackReason && (
        <div style={{ fontSize: 12, color: HBC_COLORS.gray600 }}>
          Runtime note: {runtimeInfo.fallbackReason}
        </div>
      )}
    </div>
  );
};
