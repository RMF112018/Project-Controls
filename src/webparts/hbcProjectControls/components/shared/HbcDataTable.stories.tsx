import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  FluentProvider,
  makeStyles,
  shorthands,
  teamsDarkTheme,
  teamsHighContrastTheme,
  tokens,
  type Theme,
} from '@fluentui/react-components';
import { hbcLightTheme } from '../../theme/hbcTheme';
import {
  HbcDataTable,
  type IHbcDataTableColumn,
  type IHbcFormulaConfig,
} from './HbcDataTable';

interface IProjectRow {
  id: number;
  project: string;
  status: 'Active' | 'Pending' | 'Closed';
  region: 'North' | 'South' | 'East' | 'West';
  manager: string;
  budget: number;
}

const useSlotStyles = makeStyles({
  slotWrap: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
  },
  pill: {
    backgroundColor: tokens.colorNeutralBackground2,
    color: tokens.colorNeutralForeground2,
    borderRadius: tokens.borderRadiusMedium,
    paddingTop: tokens.spacingVerticalXXS,
    paddingBottom: tokens.spacingVerticalXXS,
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
  },
});

const ROWS: IProjectRow[] = [
  { id: 1, project: 'Orchid Tower', status: 'Active', region: 'North', manager: 'Maya Davis', budget: 3200000 },
  { id: 2, project: 'Maple Labs', status: 'Pending', region: 'East', manager: 'Sean Holt', budget: 1450000 },
  { id: 3, project: 'Cedar Medical', status: 'Closed', region: 'South', manager: 'Alex Stone', budget: 2875000 },
  { id: 4, project: 'Riverfront Plaza', status: 'Active', region: 'West', manager: 'Riley Gomez', budget: 4100000 },
  { id: 5, project: 'Summit Campus', status: 'Pending', region: 'North', manager: 'Jordan Lee', budget: 1995000 },
  { id: 6, project: 'Pine Distribution', status: 'Active', region: 'East', manager: 'Kai Morgan', budget: 2550000 },
];

const LARGE_ROWS: IProjectRow[] = Array.from({ length: 260 }, (_, index) => ({
  id: index + 1,
  project: `Project ${index + 1}`,
  status: index % 3 === 0 ? 'Active' : index % 3 === 1 ? 'Pending' : 'Closed',
  region: index % 4 === 0 ? 'North' : index % 4 === 1 ? 'South' : index % 4 === 2 ? 'East' : 'West',
  manager: `Manager ${index + 1}`,
  budget: 1000000 + (index * 15000),
}));

const COLUMNS: IHbcDataTableColumn<IProjectRow>[] = [
  { key: 'project', header: 'Project', render: (item) => item.project, sortable: true },
  { key: 'status', header: 'Status', render: (item) => item.status, sortable: true },
  { key: 'region', header: 'Region', render: (item) => item.region, sortable: true },
  { key: 'manager', header: 'Manager', render: (item) => item.manager },
  { key: 'budget', header: 'Budget', render: (item) => `$${item.budget.toLocaleString()}`, sortable: true },
];

const FORMULAS: IHbcFormulaConfig<IProjectRow>[] = [
  {
    label: 'Total Budget',
    compute: (items) => `$${items.reduce((sum, item) => sum + item.budget, 0).toLocaleString()}`,
  },
  {
    label: 'Active',
    compute: (items) => items.filter((item) => item.status === 'Active').length,
  },
];

const ThemeDecorator = (theme: Theme) => (Story: React.ComponentType): React.ReactElement => (
  <FluentProvider theme={theme}>
    <Story />
  </FluentProvider>
);

function mergeThemes(baseTheme: Theme, hostThemePatch: Partial<Theme>): Theme {
  return {
    ...baseTheme,
    ...hostThemePatch,
  };
}

const HostMergedTheme: Theme = mergeThemes(hbcLightTheme, {
  colorBrandBackground: tokens.colorPaletteDarkOrangeBackground3,
  colorBrandForeground1: tokens.colorPaletteDarkOrangeForeground2,
  colorNeutralBackground1: tokens.colorPaletteBeigeBackground2,
});

const meta: Meta<typeof HbcDataTable<IProjectRow>> = {
  title: 'Shared/HbcDataTable',
  component: HbcDataTable<IProjectRow>,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    tableId: 'storybook.hbcDataTable.default',
    columns: COLUMNS,
    items: ROWS,
    keyExtractor: (item: IProjectRow) => item.id,
    ariaLabel: 'Project controls table',
    enableFiltering: true,
    enableColumnVisibility: true,
    enableColumnResize: true,
  },
};

export default meta;
type Story = StoryObj<typeof HbcDataTable<IProjectRow>>;

const ToolbarSlot = (): React.ReactElement => {
  const styles = useSlotStyles();
  return (
    <div className={styles.slotWrap}>
      <span className={styles.pill}>Pipeline</span>
      <span className={styles.pill}>Q1 Focus</span>
    </div>
  );
};

const FooterSlot = (): React.ReactElement => {
  const styles = useSlotStyles();
  return (
    <div className={styles.slotWrap}>
      <span>Data source: MockDataService</span>
      <span className={styles.pill}>Synced</span>
    </div>
  );
};

export const Default: Story = {};

export const Loading: Story = {
  args: {
    isLoading: true,
    items: [],
  },
};

export const Empty: Story = {
  args: {
    items: [],
    emptyTitle: 'No rows available',
    emptyDescription: 'Try widening your filters or clear active grouping.',
  },
};

export const CompactDensity: Story = {
  args: {
    defaultDensity: 'compact',
    tableId: 'storybook.hbcDataTable.compact',
  },
};

export const WithToolbarSlot: Story = {
  args: {
    toolbarSlot: <ToolbarSlot />,
    tableId: 'storybook.hbcDataTable.toolbarSlot',
  },
};

export const WithFooterSlot: Story = {
  args: {
    footerSlot: <FooterSlot />,
    tableId: 'storybook.hbcDataTable.footerSlot',
  },
};

export const WithFormulas: Story = {
  args: {
    enableFormulas: true,
    formulas: FORMULAS,
    tableId: 'storybook.hbcDataTable.formulas',
  },
};

export const WithRowSelection: Story = {
  args: {
    enableRowSelection: true,
    tableId: 'storybook.hbcDataTable.selection',
  },
};

export const WithColumnVisibility: Story = {
  args: {
    enableColumnVisibility: true,
    tableId: 'storybook.hbcDataTable.visibility',
  },
};

export const WithGrouping: Story = {
  args: {
    enableGrouping: true,
    groupBy: ['status'],
    tableId: 'storybook.hbcDataTable.grouping',
  },
};

export const LargeVirtualized: Story = {
  args: {
    items: LARGE_ROWS,
    virtualization: {
      enabled: true,
      threshold: 200,
      containerHeight: 560,
      estimateRowHeight: 44,
      overscan: 8,
    },
    tableId: 'storybook.hbcDataTable.largeVirtualized',
  },
};

export const ChartLinkedInteraction: Story = {
  args: {
    linkedChartId: 'story.chart.pipeline',
    onChartLinkHighlight: () => undefined,
    onRowClick: () => undefined,
    tableId: 'storybook.hbcDataTable.chartLinked',
  },
};

export const DarkMode: Story = {
  decorators: [ThemeDecorator(teamsDarkTheme)],
  args: {
    tableId: 'storybook.hbcDataTable.darkMode',
  },
};

export const HighContrast: Story = {
  decorators: [ThemeDecorator(teamsHighContrastTheme)],
  args: {
    tableId: 'storybook.hbcDataTable.highContrast',
  },
};

export const MergedHostTheme: Story = {
  decorators: [ThemeDecorator(HostMergedTheme)],
  args: {
    tableId: 'storybook.hbcDataTable.mergedHostTheme',
  },
};
