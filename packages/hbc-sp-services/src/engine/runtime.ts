import { IScheduleEngineRuntimeInfo } from '../models/IScheduleEngine';

export function getScheduleEngineRuntimeInfo(): IScheduleEngineRuntimeInfo {
  const workerEnabled = typeof Worker !== 'undefined';
  const wasmEnabled = typeof WebAssembly !== 'undefined';
  let fallbackReason: string | undefined;

  if (!workerEnabled) {
    fallbackReason = 'Worker API unavailable; falling back to main-thread execution.';
  } else if (!wasmEnabled) {
    fallbackReason = 'WebAssembly unavailable; using JavaScript compute path.';
  }

  return { workerEnabled, wasmEnabled, fallbackReason };
}
