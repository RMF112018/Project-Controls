import * as React from 'react';
import type { ITelemetryService } from '@hbc/sp-services';
import { HBC_COLORS } from '../../theme/tokens';

interface IErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  boundaryName?: string;
  telemetryService?: ITelemetryService;
  telemetryEnabled?: boolean;
  telemetryProperties?: Record<string, string>;
}

interface IErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

function isLocalhostTelemetryEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.location.hostname === 'localhost';
}

export class ErrorBoundary extends React.Component<IErrorBoundaryProps, IErrorBoundaryState> {
  constructor(props: IErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): IErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);

    const telemetryEnabled = this.props.telemetryEnabled ?? isLocalhostTelemetryEnabled();
    if (!telemetryEnabled || !this.props.telemetryService?.isInitialized()) {
      return;
    }

    try {
      this.props.telemetryService.trackException(error, {
        boundaryName: this.props.boundaryName ?? 'ErrorBoundary',
        hasComponentStack: String(Boolean(errorInfo.componentStack)),
        ...this.props.telemetryProperties,
      });
    } catch {
      // Telemetry failures must never interfere with boundary fallback rendering.
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{ padding: '24px', backgroundColor: HBC_COLORS.errorLight, borderRadius: '8px', border: `1px solid ${HBC_COLORS.error}` }}>
          <h3 style={{ color: HBC_COLORS.error, margin: '0 0 8px 0' }}>Something went wrong</h3>
          <p style={{ color: HBC_COLORS.gray700, margin: 0, fontSize: '14px' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            style={{ marginTop: '12px', padding: '6px 16px', backgroundColor: HBC_COLORS.navy, color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
