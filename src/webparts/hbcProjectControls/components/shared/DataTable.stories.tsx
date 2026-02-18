import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { DataTable, IDataTableColumn } from './DataTable';

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

const COLUMNS: IDataTableColumn<IRow>[] = [
  { key: 'name', header: 'Project Name', render: (r) => r.name, sortable: true },
  { key: 'status', header: 'Status', render: (r) => r.status, width: '120px' },
  { key: 'value', header: 'Contract Value', render: (r) => r.value, width: '140px' },
];

const meta: Meta<typeof DataTable<IRow>> = {
  title: 'Shared/DataTable',
  component: DataTable<IRow>,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof DataTable<IRow>>;

export const WithData: Story = {
  render: () => (
    <DataTable<IRow>
      columns={COLUMNS}
      items={MOCK_ROWS}
      keyExtractor={(r) => r.id}
    />
  ),
};

export const Loading: Story = {
  render: () => (
    <DataTable<IRow>
      columns={COLUMNS}
      items={[]}
      keyExtractor={(r) => r.id}
      isLoading={true}
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <DataTable<IRow>
      columns={COLUMNS}
      items={[]}
      keyExtractor={(r) => r.id}
      emptyTitle="No projects found"
      emptyDescription="No projects match your search criteria."
    />
  ),
};

export const Paginated: Story = {
  render: () => (
    <DataTable<IRow>
      columns={COLUMNS}
      items={MOCK_ROWS}
      keyExtractor={(r) => r.id}
      pageSize={3}
    />
  ),
};
