import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { HbcTanStackTable } from '../../tanstack/table/HbcTanStackTable';
import type { IHbcTanStackTableColumn } from '../../tanstack/table/types';

interface IRow {
  id: number;
  name: string;
  status: string;
  value: string;
}

const MOCK_ROWS: IRow[] = [
  { id: 1, name: 'HBC-2024-001 — Office Tower', status: 'Active', value: '$4.2M' },
  { id: 2, name: 'HBC-2024-002 — Warehouse Expansion', status: 'Active', value: '$1.8M' },
  { id: 3, name: 'HBC-2024-003 — Retail Complex', status: 'Pending', value: '$3.1M' },
  { id: 4, name: 'HBC-2024-004 — Medical Facility', status: 'Active', value: '$7.6M' },
  { id: 5, name: 'HBC-2024-005 — Parking Structure', status: 'Closed', value: '$2.3M' },
];

const MANY_ROWS: IRow[] = Array.from({ length: 260 }, (_, index) => ({
  id: index + 1,
  name: `HBC-2024-${String(index + 1).padStart(3, '0')} — Project ${index + 1}`,
  status: index % 3 === 0 ? 'Active' : index % 3 === 1 ? 'Pending' : 'Closed',
  value: `$${(index + 1) * 100_000}`,
}));

const COLUMNS: IHbcTanStackTableColumn<IRow>[] = [
  { key: 'name', header: 'Project Name', render: (row) => row.name, sortable: true },
  { key: 'status', header: 'Status', render: (row) => row.status, width: '120px' },
  { key: 'value', header: 'Contract Value', render: (row) => row.value, width: '140px' },
];

const meta: Meta<typeof HbcTanStackTable<IRow>> = {
  title: 'Shared/HbcTanStackTable',
  component: HbcTanStackTable<IRow>,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof HbcTanStackTable<IRow>>;

export const SmallStatic: Story = {
  render: () => (
    <HbcTanStackTable<IRow>
      columns={COLUMNS}
      items={MOCK_ROWS}
      keyExtractor={(row) => row.id}
      ariaLabel="Projects data table"
    />
  ),
};

export const LargeVirtualized: Story = {
  render: () => (
    <HbcTanStackTable<IRow>
      columns={COLUMNS}
      items={MANY_ROWS}
      keyExtractor={(row) => row.id}
      virtualization={{ enabled: true, threshold: 200, containerHeight: 420 }}
      ariaLabel="Large projects data table"
    />
  ),
};

export const Loading: Story = {
  render: () => (
    <HbcTanStackTable<IRow>
      columns={COLUMNS}
      items={[]}
      keyExtractor={(row) => row.id}
      isLoading={true}
      ariaLabel="Projects data table loading"
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <HbcTanStackTable<IRow>
      columns={COLUMNS}
      items={[]}
      keyExtractor={(row) => row.id}
      emptyTitle="No projects found"
      emptyDescription="No projects match your search criteria."
      ariaLabel="Projects data table"
    />
  ),
};
