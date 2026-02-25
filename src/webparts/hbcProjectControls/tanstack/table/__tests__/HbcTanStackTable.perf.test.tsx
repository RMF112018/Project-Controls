import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { HbcTanStackTable } from '../HbcTanStackTable';
import type { IHbcTanStackTableColumn } from '../types';

interface IRow {
  id: number;
  name: string;
  value: number;
  status: string;
}

const COLUMNS: IHbcTanStackTableColumn<IRow>[] = [
  { key: 'name', header: 'Name', render: (row) => row.name, sortable: true },
  { key: 'value', header: 'Value', render: (row) => String(row.value) },
  { key: 'status', header: 'Status', render: (row) => row.status },
];

function generateRows(count: number): IRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Project ${i + 1}`,
    value: Math.floor(Math.random() * 10000),
    status: ['Active', 'Complete', 'Pending'][i % 3],
  }));
}

function renderTable(
  rows: IRow[],
  overrides?: Partial<React.ComponentProps<typeof HbcTanStackTable<IRow>>>
): void {
  render(
    <FluentProvider theme={webLightTheme}>
      <HbcTanStackTable<IRow>
        columns={COLUMNS}
        items={rows}
        keyExtractor={(row) => row.id}
        pageSize={rows.length + 1}
        virtualization={{ enabled: true, threshold: 200, containerHeight: 560 }}
        {...overrides}
      />
    </FluentProvider>
  );
}

describe('HbcTanStackTable Performance', () => {
  it('renders 500 rows with initial render under 200ms (median of 3 runs)', () => {
    const rows = generateRows(500);
    const durations: number[] = [];

    for (let run = 0; run < 3; run++) {
      const start = performance.now();
      const { unmount } = render(
        <FluentProvider theme={webLightTheme}>
          <HbcTanStackTable<IRow>
            columns={COLUMNS}
            items={rows}
            keyExtractor={(row) => row.id}
            pageSize={600}
            virtualization={{ enabled: true, threshold: 200, containerHeight: 560 }}
          />
        </FluentProvider>
      );
      const duration = performance.now() - start;
      durations.push(duration);
      unmount();
    }

    durations.sort((a, b) => a - b);
    const median = durations[1]; // middle of 3
    expect(median).toBeLessThan(200);
  });

  it('sets data-perf-table-rows attribute with row count', () => {
    const rows = generateRows(100);
    renderTable(rows);

    const root = screen.getByRole('table').closest('[data-table-engine="tanstack"]');
    expect(root).toHaveAttribute('data-perf-table-rows', '100');
  });

  it('activates virtualization at 200+ rows', () => {
    const rows = generateRows(250);
    renderTable(rows);

    expect(screen.getByRole('table').parentElement).toHaveAttribute('data-virtualized', 'true');
  });

  it('does NOT virtualize below threshold', () => {
    const rows = generateRows(50);
    renderTable(rows);

    expect(screen.getByRole('table').parentElement).toHaveAttribute('data-virtualized', 'false');
  });

  it('uses MemoizedTableRow by default (disableRowMemoization=false)', () => {
    const rows = generateRows(5);
    renderTable(rows);

    // All 5 rows should render
    const tableRows = screen.getAllByRole('row');
    // 1 header row + 5 data rows = 6
    expect(tableRows.length).toBeGreaterThanOrEqual(6);
  });

  it('renders with disableRowMemoization opt-out', () => {
    const rows = generateRows(5);
    renderTable(rows, { disableRowMemoization: true });

    const tableRows = screen.getAllByRole('row');
    expect(tableRows.length).toBeGreaterThanOrEqual(6);
  });
});
