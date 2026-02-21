import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { HbcTanStackTable } from '../HbcTanStackTable';
import type { IHbcTanStackTableColumn } from '../types';

interface IRow {
  id: number;
  name: string;
  value: number;
}

const COLUMNS: IHbcTanStackTableColumn<IRow>[] = [
  {
    key: 'name',
    header: 'Name',
    render: (row) => row.name,
    sortable: true,
  },
  {
    key: 'value',
    header: 'Value',
    render: (row) => String(row.value),
  },
];

const SMALL_ROWS: IRow[] = [
  { id: 1, name: 'Alpha', value: 10 },
  { id: 2, name: 'Beta', value: 20 },
];

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
        {...overrides}
      />
    </FluentProvider>
  );
}

describe('HbcTanStackTable', () => {
  it('calls onSort when sortable header is clicked or keyboard-activated', () => {
    const onSort = jest.fn();
    renderTable(SMALL_ROWS, { onSort });

    fireEvent.click(screen.getByText('Name'));
    expect(onSort).toHaveBeenCalledWith('name');

    fireEvent.keyDown(screen.getByText('Name'), { key: 'Enter' });
    expect(onSort).toHaveBeenCalledTimes(2);
  });

  it('calls onRowClick when row is keyboard activated', () => {
    const onRowClick = jest.fn();
    renderTable(SMALL_ROWS, { onRowClick });

    const row = screen.getByText('Alpha').closest('tr');
    expect(row).not.toBeNull();
    fireEvent.keyDown(row!, { key: 'Enter' });
    expect(onRowClick).toHaveBeenCalledWith(SMALL_ROWS[0]);
  });

  it('enables virtualization when row count meets threshold', () => {
    const manyRows = Array.from({ length: 250 }, (_, index) => ({
      id: index + 1,
      name: `Project ${index + 1}`,
      value: index,
    }));

    renderTable(manyRows, {
      virtualization: { enabled: true, threshold: 200, containerHeight: 400 },
      pageSize: 500, // disable effective pagination so all rows hit the virtualizer
    });

    expect(screen.getByRole('table').parentElement).toHaveAttribute('data-virtualized', 'true');
  });
});
