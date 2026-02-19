import { IScheduleActivity } from '../models/IScheduleActivity';
import { IScheduleQualityReport } from '../models/IScheduleEngine';
import { ScheduleEngine } from './ScheduleEngine';

const fallbackEngine = new ScheduleEngine();

export async function runScheduleQualityChecksWithWorker(
  projectCode: string,
  activities: IScheduleActivity[],
): Promise<IScheduleQualityReport> {
  if (typeof Worker === 'undefined') {
    return fallbackEngine.runScheduleQualityChecks(projectCode, activities);
  }

  const workerUrl = (globalThis as unknown as { __HBC_SCHEDULE_QUALITY_WORKER_URL__?: string }).__HBC_SCHEDULE_QUALITY_WORKER_URL__;
  if (!workerUrl) {
    return fallbackEngine.runScheduleQualityChecks(projectCode, activities);
  }

  try {
    const worker = new Worker(workerUrl, { type: 'module' });
    const requestId = `quality-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const response = await new Promise<IScheduleQualityReport>((resolve, reject) => {
      const timeout = setTimeout(() => {
        worker.terminate();
        reject(new Error('Schedule quality worker timeout; falling back to in-thread.'));
      }, 8000);

      worker.onmessage = (event: MessageEvent<{ id: string; ok: boolean; report?: IScheduleQualityReport; error?: string }>): void => {
        if (event.data.id !== requestId) return;
        clearTimeout(timeout);
        worker.terminate();
        if (event.data.ok && event.data.report) {
          resolve(event.data.report);
          return;
        }
        reject(new Error(event.data.error || 'Schedule quality worker failed'));
      };
      worker.onerror = () => {
        clearTimeout(timeout);
        worker.terminate();
        reject(new Error('Schedule quality worker crashed'));
      };

      worker.postMessage({ id: requestId, projectCode, activities });
    });
    return response;
  } catch {
    return fallbackEngine.runScheduleQualityChecks(projectCode, activities);
  }
}
