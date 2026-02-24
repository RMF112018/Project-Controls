import * as React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useProvisioningStatus } from '../useProvisioningStatus';
import type { SignalRMessage, IProvisioningStatusMessage } from '@hbc/sp-services';

// Mock the SignalR context
const mockSubscribe = jest.fn();
const mockBroadcast = jest.fn();

jest.mock('../../contexts/SignalRContext', () => ({
  useSignalRContext: () => ({
    connectionStatus: 'connected',
    isEnabled: true,
    subscribe: mockSubscribe,
    broadcastChange: mockBroadcast,
  }),
}));

function createProvisioningMessage(
  overrides?: Partial<IProvisioningStatusMessage>
): IProvisioningStatusMessage {
  return {
    type: 'ProvisioningStatus',
    projectCode: '25-042-01',
    currentStep: 1,
    totalSteps: 7,
    stepStatus: 'in_progress',
    stepLabel: 'Create SharePoint Site',
    progress: 14,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe('useProvisioningStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscribe.mockReturnValue(jest.fn()); // return unsubscribe function
  });

  it('returns initial idle state', () => {
    const { result } = renderHook(() => useProvisioningStatus('25-042-01'));

    expect(result.current.status).toBe('idle');
    expect(result.current.currentStep).toBe(0);
    expect(result.current.progress).toBe(0);
    expect(result.current.isConnected).toBe(true);
  });

  it('subscribes to ProvisioningStatus channel', () => {
    renderHook(() => useProvisioningStatus('25-042-01'));

    expect(mockSubscribe).toHaveBeenCalledWith('ProvisioningStatus', expect.any(Function));
  });

  it('updates state when matching message received', () => {
    let messageCallback: (msg: SignalRMessage) => void = () => {};
    mockSubscribe.mockImplementation((_channel: string, cb: (msg: SignalRMessage) => void) => {
      messageCallback = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => useProvisioningStatus('25-042-01'));

    act(() => {
      messageCallback(createProvisioningMessage({
        currentStep: 3,
        stepStatus: 'completed',
        stepLabel: 'Hub Association',
        progress: 43,
      }));
    });

    expect(result.current.status).toBe('in_progress');
    expect(result.current.currentStep).toBe(3);
    expect(result.current.stepLabel).toBe('Hub Association');
    expect(result.current.progress).toBe(43);
  });

  it('filters messages by projectCode', () => {
    let messageCallback: (msg: SignalRMessage) => void = () => {};
    mockSubscribe.mockImplementation((_channel: string, cb: (msg: SignalRMessage) => void) => {
      messageCallback = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => useProvisioningStatus('25-042-01'));

    act(() => {
      // Message for different project — should be ignored
      messageCallback(createProvisioningMessage({
        projectCode: '25-099-99',
        currentStep: 5,
        progress: 71,
      }));
    });

    expect(result.current.currentStep).toBe(0); // unchanged
    expect(result.current.progress).toBe(0);
  });

  it('unsubscribes on unmount', () => {
    const unsubscribeMock = jest.fn();
    mockSubscribe.mockReturnValue(unsubscribeMock);

    const { unmount } = renderHook(() => useProvisioningStatus('25-042-01'));

    unmount();

    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });

  it('resets state when projectCode becomes undefined', () => {
    let messageCallback: (msg: SignalRMessage) => void = () => {};
    mockSubscribe.mockImplementation((_channel: string, cb: (msg: SignalRMessage) => void) => {
      messageCallback = cb;
      return jest.fn();
    });

    const { result, rerender } = renderHook(
      ({ code }: { code: string | undefined }) => useProvisioningStatus(code),
      { initialProps: { code: '25-042-01' as string | undefined } }
    );

    act(() => {
      messageCallback(createProvisioningMessage({ currentStep: 3, progress: 43 }));
    });

    expect(result.current.currentStep).toBe(3);

    rerender({ code: undefined });

    expect(result.current.status).toBe('idle');
    expect(result.current.currentStep).toBe(0);
  });

  it('detects failed status', () => {
    let messageCallback: (msg: SignalRMessage) => void = () => {};
    mockSubscribe.mockImplementation((_channel: string, cb: (msg: SignalRMessage) => void) => {
      messageCallback = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => useProvisioningStatus('25-042-01'));

    act(() => {
      messageCallback(createProvisioningMessage({
        stepStatus: 'failed',
        currentStep: 3,
        error: 'Hub association failed',
      }));
    });

    expect(result.current.status).toBe('failed');
    expect(result.current.error).toBe('Hub association failed');
  });

  it('detects compensating status', () => {
    let messageCallback: (msg: SignalRMessage) => void = () => {};
    mockSubscribe.mockImplementation((_channel: string, cb: (msg: SignalRMessage) => void) => {
      messageCallback = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => useProvisioningStatus('25-042-01'));

    act(() => {
      messageCallback(createProvisioningMessage({
        stepStatus: 'compensating',
        currentStep: 2,
      }));
    });

    expect(result.current.status).toBe('compensating');
  });
});
