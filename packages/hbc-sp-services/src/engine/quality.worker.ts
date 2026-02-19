import { ScheduleEngine } from './ScheduleEngine';
import { IScheduleActivity } from '../models/IScheduleActivity';

interface IQualityWorkerRequest {
  id: string;
  projectCode: string;
  activities: IScheduleActivity[];
}

const qualityEngine = new ScheduleEngine();

self.onmessage = (event: MessageEvent<IQualityWorkerRequest>): void => {
  const { id, projectCode, activities } = event.data;
  try {
    const report = qualityEngine.runScheduleQualityChecks(projectCode, activities);
    self.postMessage({ id, ok: true, report });
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : 'Quality worker failed',
    });
  }
};
