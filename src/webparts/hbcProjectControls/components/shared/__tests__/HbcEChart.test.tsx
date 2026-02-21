import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { HbcEChart } from '../HbcEChart';
import type { EChartsOption } from 'echarts';

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <FluentProvider theme={webLightTheme}>{children}</FluentProvider>
);

const sampleOption: EChartsOption = {
  series: [{ type: 'bar', data: [1, 2, 3] }],
};

describe('HbcEChart', () => {
  it('renders the echarts mock container', async () => {
    render(
      <Wrapper>
        <HbcEChart option={sampleOption} ariaLabel="Test chart" />
      </Wrapper>
    );
    await waitFor(() => {
      expect(screen.getByTestId('echarts-mock')).toBeInTheDocument();
    });
  });

  it('renders empty state when empty prop is true', () => {
    render(
      <Wrapper>
        <HbcEChart option={sampleOption} empty emptyMessage="Nothing to show" />
      </Wrapper>
    );
    expect(screen.getByText('Nothing to show')).toBeInTheDocument();
    expect(screen.queryByTestId('echarts-mock')).not.toBeInTheDocument();
  });

  it('applies custom height to container', async () => {
    const { container } = render(
      <Wrapper>
        <HbcEChart option={sampleOption} height={450} ariaLabel="Height test" />
      </Wrapper>
    );
    await waitFor(() => {
      const div = container.querySelector('[role="img"]') as HTMLElement;
      expect(div).not.toBeNull();
      expect(div.style.height).toBe('450px');
    });
  });
});
