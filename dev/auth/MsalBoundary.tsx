/**
 * React error boundary for unhandled MSAL / BrowserAuthError exceptions.
 * Lives exclusively in dev/auth/ — never imported by src/ or @hbc/sp-services.
 */
import * as React from 'react';
import { BrowserAuthError, InteractionRequiredAuthError } from '@azure/msal-browser';

interface IMsalBoundaryProps {
  onReset: () => void;
  children: React.ReactNode;
}

interface IMsalBoundaryState {
  error: Error | null;
}

export class MsalBoundary extends React.Component<IMsalBoundaryProps, IMsalBoundaryState> {
  state: IMsalBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): IMsalBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[MsalBoundary] Caught unhandled auth error:', error, info);
  }

  render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    const isInteraction = error instanceof InteractionRequiredAuthError;
    const msg = isInteraction
      ? 'Your session has expired. Please sign in again to continue.'
      : error instanceof BrowserAuthError
      ? `Authentication error: ${error.message}`
      : `Unexpected error: ${error.message}`;

    return (
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', background: '#1a1a2e',
          color: '#fff', fontFamily: 'Segoe UI, sans-serif', gap: 16,
        }}
      >
        <h2 style={{ color: '#ffd700', margin: 0 }}>Session Problem</h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 360, textAlign: 'center', margin: 0 }}>
          {msg}
        </p>
        <button
          onClick={() => {
            this.setState({ error: null });
            this.props.onReset();
          }}
          style={{
            padding: '10px 24px', background: '#0078d4', color: '#fff',
            border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 15,
          }}
        >
          Sign In Again
        </button>
      </div>
    );
  }
}
