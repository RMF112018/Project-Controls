import * as React from 'react';
import { useSignalRContext } from '../contexts/SignalRContext';
import type { SignalRMessage, IProvisioningStatusMessage } from '@hbc/sp-services';
import type { ICompensationResult } from '@hbc/sp-services';

export interface IProvisioningStatusState {
  status: 'idle' | 'in_progress' | 'completed' | 'failed' | 'compensating';
  currentStep: number;
  totalSteps: number;
  progress: number;
  stepLabel: string;
  stepStatus: IProvisioningStatusMessage['stepStatus'];
  error?: string;
  isConnected: boolean;
  compensationResults?: ICompensationResult[];
}

const INITIAL_STATE: IProvisioningStatusState = {
  status: 'idle',
  currentStep: 0,
  totalSteps: 7,
  progress: 0,
  stepLabel: '',
  stepStatus: 'pending',
  isConnected: false,
};

/**
 * Phase 5C: Subscribe to real-time provisioning status updates via SignalR.
 * Filters by projectCode client-side (server-side group filtering deferred to Phase 6).
 */
export function useProvisioningStatus(projectCode: string | undefined): IProvisioningStatusState {
  const { subscribe, connectionStatus } = useSignalRContext();
  const [state, setState] = React.useState<IProvisioningStatusState>(INITIAL_STATE);

  React.useEffect(() => {
    if (!projectCode) {
      setState(INITIAL_STATE);
      return;
    }

    const unsubscribe = subscribe('ProvisioningStatus', (msg: SignalRMessage) => {
      if (msg.type !== 'ProvisioningStatus') return;
      const statusMsg = msg as IProvisioningStatusMessage;

      // Client-side filter by projectCode
      if (statusMsg.projectCode !== projectCode) return;

      setState(prev => ({
        ...prev,
        status: statusMsg.stepStatus === 'compensating' ? 'compensating'
          : statusMsg.stepStatus === 'failed' ? 'failed'
          : statusMsg.stepStatus === 'completed' && statusMsg.currentStep === statusMsg.totalSteps ? 'completed'
          : 'in_progress',
        currentStep: statusMsg.currentStep,
        totalSteps: statusMsg.totalSteps,
        progress: statusMsg.progress,
        stepLabel: statusMsg.stepLabel,
        stepStatus: statusMsg.stepStatus,
        error: statusMsg.error,
        isConnected: true,
      }));
    });

    return unsubscribe;
  }, [projectCode, subscribe]);

  // Update isConnected based on SignalR connection status
  React.useEffect(() => {
    setState(prev => ({
      ...prev,
      isConnected: connectionStatus === 'connected',
    }));
  }, [connectionStatus]);

  return state;
}
