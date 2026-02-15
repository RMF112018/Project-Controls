import * as React from 'react';
import { useSignalRContext } from '../contexts/SignalRContext';
import {
  EntityType,
  SignalRConnectionStatus,
  IEntityChangedMessage,
  IWorkflowAdvancedMessage,
  SignalRMessage,
} from '@hbc/sp-services';

export interface IUseSignalROptions {
  /** Filter messages to a specific entity type */
  entityType?: EntityType;
  /** Filter messages to a specific project */
  projectCode?: string;
  /** Called when an entity change message matches filters */
  onEntityChanged?: (msg: IEntityChangedMessage) => void;
  /** Called when a workflow advanced message matches filters */
  onWorkflowAdvanced?: (msg: IWorkflowAdvancedMessage) => void;
}

export interface IUseSignalRResult {
  connectionStatus: SignalRConnectionStatus;
  isEnabled: boolean;
}

/**
 * Hook for subscribing to real-time SignalR messages.
 *
 * Automatically subscribes on mount and unsubscribes on unmount.
 * Filters messages by entityType and/or projectCode if provided.
 */
export function useSignalR(options: IUseSignalROptions = {}): IUseSignalRResult {
  const { connectionStatus, isEnabled, subscribe } = useSignalRContext();
  const { entityType, projectCode, onEntityChanged, onWorkflowAdvanced } = options;

  // Use refs for callbacks to avoid re-subscribing on every render
  const onEntityChangedRef = React.useRef(onEntityChanged);
  const onWorkflowAdvancedRef = React.useRef(onWorkflowAdvanced);
  onEntityChangedRef.current = onEntityChanged;
  onWorkflowAdvancedRef.current = onWorkflowAdvanced;

  // Subscribe to EntityChanged messages
  React.useEffect(() => {
    if (!isEnabled || !onEntityChangedRef.current) return;

    const unsubscribe = subscribe('EntityChanged', (msg: SignalRMessage) => {
      if (msg.type !== 'EntityChanged') return;
      const entityMsg = msg as IEntityChangedMessage;

      // Apply filters
      if (entityType && entityMsg.entityType !== entityType) return;
      if (projectCode && entityMsg.projectCode !== projectCode) return;

      onEntityChangedRef.current?.(entityMsg);
    });

    return unsubscribe;
  }, [isEnabled, subscribe, entityType, projectCode]);

  // Subscribe to WorkflowAdvanced messages
  React.useEffect(() => {
    if (!isEnabled || !onWorkflowAdvancedRef.current) return;

    const unsubscribe = subscribe('WorkflowAdvanced', (msg: SignalRMessage) => {
      if (msg.type !== 'WorkflowAdvanced') return;
      const wfMsg = msg as IWorkflowAdvancedMessage;

      // Apply filters
      if (entityType && wfMsg.entityType !== entityType) return;
      if (projectCode && wfMsg.projectCode !== projectCode) return;

      onWorkflowAdvancedRef.current?.(wfMsg);
    });

    return unsubscribe;
  }, [isEnabled, subscribe, entityType, projectCode]);

  return { connectionStatus, isEnabled };
}
