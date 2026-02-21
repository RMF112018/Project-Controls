import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { RouteErrorBoundary } from '../RouteErrorBoundary';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <FluentProvider theme={webLightTheme}>{children}</FluentProvider>
);

describe('RouteErrorBoundary', () => {
  it('renders error message from Error instance', () => {
    const error = new Error('Test error message');
    render(<RouteErrorBoundary error={error} reset={jest.fn()} />, { wrapper });

    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('renders role="alert" on root element', () => {
    const error = new Error('fail');
    render(<RouteErrorBoundary error={error} reset={jest.fn()} />, { wrapper });

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('calls reset when "Try Again" is clicked', () => {
    const resetFn = jest.fn();
    render(<RouteErrorBoundary error={new Error('fail')} reset={resetFn} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /try loading the page again/i }));
    expect(resetFn).toHaveBeenCalledTimes(1);
  });

  it('shows technical details when info.componentStack is provided', () => {
    const error = new Error('fail');
    const info = { componentStack: '\n    at BrokenComponent\n    at div' };
    render(<RouteErrorBoundary error={error} info={info} reset={jest.fn()} />, { wrapper });

    expect(screen.getByText('Technical details')).toBeInTheDocument();
    expect(screen.getByText(/at BrokenComponent/)).toBeInTheDocument();
  });

  it('hides technical details when info is absent', () => {
    const error = new Error('fail');
    render(<RouteErrorBoundary error={error} reset={jest.fn()} />, { wrapper });

    expect(screen.queryByText('Technical details')).not.toBeInTheDocument();
  });

  it('handles non-Error objects gracefully', () => {
    // Simulates a thrown string (not an Error instance)
    const error = 'string error' as unknown as Error;
    render(<RouteErrorBoundary error={error} reset={jest.fn()} />, { wrapper });

    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
  });

  it('renders heading text', () => {
    render(<RouteErrorBoundary error={new Error('fail')} reset={jest.fn()} />, { wrapper });

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
