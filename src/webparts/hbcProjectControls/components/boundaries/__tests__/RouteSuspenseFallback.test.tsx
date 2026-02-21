import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { RouteSuspenseFallback } from '../RouteSuspenseFallback';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <FluentProvider theme={webLightTheme}>{children}</FluentProvider>
);

describe('RouteSuspenseFallback', () => {
  it('renders with aria-live="polite" and aria-busy="true"', () => {
    const { container } = render(<RouteSuspenseFallback />, { wrapper });

    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.getAttribute('aria-busy')).toBe('true');
  });

  it('has an accessible label', () => {
    render(<RouteSuspenseFallback />, { wrapper });
    expect(screen.getByLabelText('Loading page')).toBeInTheDocument();
  });

  it('renders skeleton content', () => {
    const { container } = render(<RouteSuspenseFallback />, { wrapper });

    // Should render at least two HbcSkeleton instances (kpi-grid + table)
    const skeletons = container.querySelectorAll('[aria-busy="true"]');
    // The outer container + 2 skeletons = 3 elements with aria-busy
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });
});
