import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { PhaseSuspenseFallback } from '../PhaseSuspenseFallback';

describe('PhaseSuspenseFallback', () => {
  it('announces loading state for assistive technologies', () => {
    const { container } = render(<PhaseSuspenseFallback label="Loading operations module..." />);

    expect(screen.getByText('Loading operations module...')).toBeInTheDocument();

    const statusNode = container.querySelector('[aria-live="polite"]');
    expect(statusNode).not.toBeNull();
    expect(statusNode?.getAttribute('aria-busy')).toBe('true');
  });
});
