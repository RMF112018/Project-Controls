import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { HbcTanStackTable } from '../HbcTanStackTable';
import type { IHbcTanStackTableColumn } from '../types';

interface IRow {
  id: number;
  name: string;
}

const COLUMNS: IHbcTanStackTableColumn<IRow>[] = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    render: (row) => row.name,
  },
];

describe('HbcTanStackTable sorting parity', () => {
  it('uses external sorting callback without mutating row order locally', () => {
    const onSort = jest.fn();
    const rows: IRow[] = [
      { id: 1, name: 'Beta' },
      { id: 2, name: 'Alpha' },
    ];

    render(
      <FluentProvider theme={webLightTheme}>
        <HbcTanStackTable<IRow>
          columns={COLUMNS}
          items={rows}
          keyExtractor={(row) => row.id}
          onSort={onSort}
          sortField="name"
          sortAsc={true}
          virtualization={{ enabled: false, threshold: 200 }}
        />
      </FluentProvider>
    );

    fireEvent.click(screen.getByText('Name'));
    expect(onSort).toHaveBeenCalledWith('name');

    const renderedNames = screen.getAllByRole('cell').map((cell) => cell.textContent);
    expect(renderedNames).toEqual(['Beta', 'Alpha']);
  });
});
