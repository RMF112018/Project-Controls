import * as React from 'react';
import {
  Button,
  Input,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Select,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import { HbcTanStackTable } from '../../tanstack/table/HbcTanStackTable';
import type { IHbcVirtualizationConfig } from '../../tanstack/table/types';
import AppContext from '../contexts/AppContext';

export type HbcDataTableSize = 'compact' | 'regular';

export interface IHbcDataTableColumn<TData> {
  key: string;
  header: string;
  render: (item: TData) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  hideOnMobile?: boolean;
}

export interface IHbcDataTableToolbarContext<TData> {
  items: TData[];
  filteredItems: TData[];
  selectedItems: TData[];
  globalFilter: string;
}

export interface IHbcDataTableFooterContext<TData> {
  items: TData[];
  filteredItems: TData[];
  selectedItems: TData[];
  filteredCount: number;
}

export interface IHbcFormulaConfig<TData> {
  label: string;
  compute: (items: TData[]) => React.ReactNode;
}

export interface IHbcDataTableMotionConfig {
  enabled?: boolean;
  durationMs?: number;
}

export interface IHbcDataTableProps<TData> {
  tableId: string;
  columns: IHbcDataTableColumn<TData>[];
  items: TData[];
  keyExtractor: (item: TData) => string | number;

  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  ariaLabel?: string;

  sortField?: string;
  sortAsc?: boolean;
  onSort?: (field: string) => void;

  pageSize?: number;
  pageIndex?: number;
  onPageIndexChange?: (pageIndex: number) => void;

  onRowClick?: (item: TData) => void;
  rowActions?: (item: TData) => React.ReactNode;

  size?: HbcDataTableSize;
  defaultDensity?: HbcDataTableSize;

  virtualization?: IHbcVirtualizationConfig;

  enableFiltering?: boolean;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  searchPlaceholder?: string;

  enableGrouping?: boolean;
  groupBy?: string[];
  onGroupByChange?: (groupBy: string[]) => void;

  enableColumnVisibility?: boolean;
  columnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;

  enableRowSelection?: boolean;
  selectedRowKeys?: Array<string | number>;
  onSelectedRowKeysChange?: (keys: Array<string | number>) => void;

  enableColumnResize?: boolean;
  columnSizing?: Record<string, number>;
  onColumnSizingChange?: (sizes: Record<string, number>) => void;

  enableInlineEditing?: boolean;
  enableFormulas?: boolean;
  formulas?: IHbcFormulaConfig<TData>[];

  toolbarSlot?: React.ReactNode | ((ctx: IHbcDataTableToolbarContext<TData>) => React.ReactNode);
  footerSlot?: React.ReactNode | ((ctx: IHbcDataTableFooterContext<TData>) => React.ReactNode);

  linkedChartId?: string;
  onChartLinkHighlight?: (payload: { chartId: string; rowKey: string | number }) => void;
  motion?: IHbcDataTableMotionConfig;

  enablePersistence?: boolean;
  persistenceNamespace?: string;
  enableBuiltInToolbar?: boolean;
  enableBuiltInFooter?: boolean;
}

interface IStoredTableSettings {
  density?: HbcDataTableSize;
  globalFilter?: string;
  groupBy?: string[];
  columnVisibility?: Record<string, boolean>;
  columnSizing?: Record<string, number>;
  pageIndex?: number;
}

const useStyles = makeStyles({
  root: {
    display: 'grid',
    ...shorthands.gap(tokens.spacingVerticalS),
  },
  motionFast: {
    transitionProperty: 'opacity, transform',
    transitionDuration: tokens.durationFaster,
    transitionTimingFunction: tokens.curveEasyEase,
  },
  motionNormal: {
    transitionProperty: 'opacity, transform',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
  },
  motionSlow: {
    transitionProperty: 'opacity, transform',
    transitionDuration: tokens.durationSlow,
    transitionTimingFunction: tokens.curveEasyEase,
  },
  shell: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding(tokens.spacingVerticalS),
    display: 'grid',
    ...shorthands.gap(tokens.spacingVerticalS),
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
  toolbarControls: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
  toolbarMeta: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  tableCompact: {
    fontSize: tokens.fontSizeBase200,
  },
  tableRegular: {
    fontSize: tokens.fontSizeBase300,
  },
  footer: {
    display: 'grid',
    ...shorthands.gap(tokens.spacingVerticalXS),
  },
  footerMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    ...shorthands.gap(tokens.spacingHorizontalS),
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  formulas: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
  formulaBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: tokens.colorNeutralBackground2,
    color: tokens.colorNeutralForeground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding(tokens.spacingVerticalXXS, tokens.spacingHorizontalS),
    fontSize: tokens.fontSizeBase200,
  },
  syncGlow: {
    transitionProperty: 'box-shadow, border-color',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    boxShadow: `0 0 0 ${tokens.strokeWidthThick} ${tokens.colorBrandStroke1}`,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  liveRegion: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

function createStorageKey(namespace: string, tableId: string): string {
  return `${namespace}:${tableId}`;
}

function readStoredSettings(namespace: string, tableId: string): IStoredTableSettings {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(createStorageKey(namespace, tableId));
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as IStoredTableSettings;
  } catch {
    return {};
  }
}

function writeStoredSettings(namespace: string, tableId: string, settings: IStoredTableSettings): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(createStorageKey(namespace, tableId), JSON.stringify(settings));
  } catch {
    // non-blocking by design
  }
}

function toMotionClass(
  styles: ReturnType<typeof useStyles>,
  motion: IHbcDataTableMotionConfig
): string | undefined {
  if (!motion.enabled) {
    return undefined;
  }

  const duration = motion.durationMs ?? 200;
  if (duration <= 160) {
    return styles.motionFast;
  }
  if (duration <= 240) {
    return styles.motionNormal;
  }
  return styles.motionSlow;
}

function filterItems<TData>(items: TData[], columns: IHbcDataTableColumn<TData>[], term: string): TData[] {
  const normalized = term.trim().toLowerCase();
  if (!normalized) {
    return items;
  }

  return items.filter((item) =>
    columns.some((column) => {
      const value = column.render(item);
      if (typeof value === 'string' || typeof value === 'number') {
        return String(value).toLowerCase().includes(normalized);
      }
      return false;
    })
  );
}

export function HbcDataTable<TData>({
  tableId,
  columns,
  items,
  keyExtractor,
  isLoading,
  emptyTitle,
  emptyDescription,
  ariaLabel = 'HBC data table',
  sortField,
  sortAsc,
  onSort,
  pageSize,
  pageIndex,
  onPageIndexChange,
  onRowClick,
  rowActions,
  size,
  defaultDensity = 'regular',
  virtualization,
  enableFiltering = true,
  globalFilter,
  onGlobalFilterChange,
  searchPlaceholder = 'Search table',
  enableGrouping,
  groupBy,
  onGroupByChange,
  enableColumnVisibility = true,
  columnVisibility,
  onColumnVisibilityChange,
  enableRowSelection,
  selectedRowKeys,
  onSelectedRowKeysChange,
  enableColumnResize = true,
  columnSizing,
  onColumnSizingChange,
  enableInlineEditing,
  enableFormulas,
  formulas = [],
  toolbarSlot,
  footerSlot,
  linkedChartId,
  onChartLinkHighlight,
  motion = { enabled: true, durationMs: 200 },
  enablePersistence = true,
  persistenceNamespace = 'hbcDataTable',
  enableBuiltInToolbar = true,
  enableBuiltInFooter = true,
}: IHbcDataTableProps<TData>): React.ReactElement {
  const styles = useStyles();
  const appContext = React.useContext(AppContext);
  const filterInteractionStartedAt = React.useRef<number | null>(null);
  const virtualizationSignatureRef = React.useRef<string>('');
  const [lastHighlightKey, setLastHighlightKey] = React.useState<string | number | null>(null);

  const initialStoredSettings = React.useMemo(
    () => readStoredSettings(persistenceNamespace, tableId),
    [persistenceNamespace, tableId]
  );

  const [internalDensity, setInternalDensity] = React.useState<HbcDataTableSize>(() =>
    initialStoredSettings.density ?? size ?? defaultDensity
  );
  const [internalFilter, setInternalFilter] = React.useState<string>(() =>
    initialStoredSettings.globalFilter ?? ''
  );
  const [internalGroupBy, setInternalGroupBy] = React.useState<string[]>(() =>
    initialStoredSettings.groupBy ?? groupBy ?? []
  );
  const [internalVisibility, setInternalVisibility] = React.useState<Record<string, boolean>>(() =>
    initialStoredSettings.columnVisibility ?? {}
  );
  const [internalPageIndex, setInternalPageIndex] = React.useState<number>(() =>
    initialStoredSettings.pageIndex ?? 0
  );
  const [internalColumnSizing, setInternalColumnSizing] = React.useState<Record<string, number>>(() =>
    initialStoredSettings.columnSizing ?? {}
  );

  const resolvedDensity = size ?? internalDensity;
  const resolvedFilter = globalFilter ?? internalFilter;
  const resolvedGroupBy = groupBy ?? internalGroupBy;
  const resolvedVisibility = columnVisibility ?? internalVisibility;
  const resolvedPageIndex = pageIndex ?? internalPageIndex;
  const resolvedColumnSizing = columnSizing ?? internalColumnSizing;

  React.useEffect(() => {
    if (!enablePersistence) {
      return;
    }

    writeStoredSettings(persistenceNamespace, tableId, {
      density: resolvedDensity,
      globalFilter: resolvedFilter,
      groupBy: resolvedGroupBy,
      columnVisibility: resolvedVisibility,
      columnSizing: resolvedColumnSizing,
      pageIndex: resolvedPageIndex,
    });
  }, [
    enablePersistence,
    persistenceNamespace,
    tableId,
    resolvedDensity,
    resolvedFilter,
    resolvedGroupBy,
    resolvedVisibility,
    resolvedColumnSizing,
    resolvedPageIndex,
  ]);

  const filteredItems = React.useMemo(
    () => filterItems(items, columns, resolvedFilter),
    [columns, items, resolvedFilter]
  );

  const selectedItems = React.useMemo(() => {
    const selectedKeySet = new Set((selectedRowKeys ?? []).map((key) => String(key)));
    return items.filter((item) => selectedKeySet.has(String(keyExtractor(item))));
  }, [items, keyExtractor, selectedRowKeys]);

  const toolbarContext = React.useMemo<IHbcDataTableToolbarContext<TData>>(
    () => ({
      items,
      filteredItems,
      selectedItems,
      globalFilter: resolvedFilter,
    }),
    [items, filteredItems, selectedItems, resolvedFilter]
  );

  const footerContext = React.useMemo<IHbcDataTableFooterContext<TData>>(
    () => ({
      items,
      filteredItems,
      selectedItems,
      filteredCount: filteredItems.length,
    }),
    [items, filteredItems, selectedItems]
  );

  const onFilterInput = (value: string): void => {
    filterInteractionStartedAt.current = Date.now();
    if (globalFilter === undefined) {
      setInternalFilter(value);
    }
    onGlobalFilterChange?.(value);
  };

  React.useEffect(() => {
    if (filterInteractionStartedAt.current === null) {
      return;
    }
    const startedAt = filterInteractionStartedAt.current;
    filterInteractionStartedAt.current = null;

    const rafId = requestAnimationFrame(() => {
      const durationMs = Math.max(0, Date.now() - startedAt);
      const route = typeof window !== 'undefined'
        ? (window.location.hash.replace(/^#/, '') || '/')
        : '/';
      appContext?.telemetryService.trackMetric('table:filter:interaction', durationMs, {
        tableId,
        route,
      });
      appContext?.telemetryService.trackEvent({
        name: 'table:filter:interaction',
        properties: {
          tableId,
          route,
        },
        measurements: {
          durationMs,
          filteredCount: filteredItems.length,
          totalCount: items.length,
        },
      });
    });

    return () => cancelAnimationFrame(rafId);
  }, [appContext, filteredItems.length, items.length, resolvedFilter, tableId]);

  React.useEffect(() => {
    if (!virtualization) {
      return;
    }
    const isVirtualized = virtualization.enabled && items.length >= virtualization.threshold;
    const signature = `${tableId}:${isVirtualized}:${filteredItems.length}:${items.length}`;
    if (virtualizationSignatureRef.current === signature) {
      return;
    }
    virtualizationSignatureRef.current = signature;

    const route = typeof window !== 'undefined'
      ? (window.location.hash.replace(/^#/, '') || '/')
      : '/';
    appContext?.telemetryService.trackEvent({
      name: 'virtualization:state',
      properties: {
        tableId,
        route,
        virtualized: String(isVirtualized),
      },
      measurements: {
        threshold: virtualization.threshold,
        filteredCount: filteredItems.length,
        totalCount: items.length,
      },
    });
  }, [appContext, filteredItems.length, items.length, tableId, virtualization]);

  const onGroupSelection = (value: string): void => {
    const nextGroupBy = value ? [value] : [];
    if (groupBy === undefined) {
      setInternalGroupBy(nextGroupBy);
    }
    onGroupByChange?.(nextGroupBy);
  };

  const onVisibilityToggle = (key: string, checked: boolean): void => {
    const nextVisibility = {
      ...resolvedVisibility,
      [key]: checked,
    };

    if (columnVisibility === undefined) {
      setInternalVisibility(nextVisibility);
    }
    onColumnVisibilityChange?.(nextVisibility);
  };

  const onDensityToggle = (): void => {
    if (size !== undefined) {
      return;
    }
    setInternalDensity((previous) => (previous === 'regular' ? 'compact' : 'regular'));
  };

  const onTablePageIndexChange = (nextPageIndex: number): void => {
    if (pageIndex === undefined) {
      setInternalPageIndex(nextPageIndex);
    }
    onPageIndexChange?.(nextPageIndex);
  };

  const onTableRowClick = React.useCallback(
    (item: TData): void => {
      const rowKey = keyExtractor(item);
      onRowClick?.(item);
      if (linkedChartId && onChartLinkHighlight) {
        setLastHighlightKey(rowKey);
        onChartLinkHighlight({
          chartId: linkedChartId,
          rowKey,
        });
      }
    },
    [keyExtractor, linkedChartId, onChartLinkHighlight, onRowClick]
  );

  const renderedToolbarSlot = typeof toolbarSlot === 'function' ? toolbarSlot(toolbarContext) : toolbarSlot;
  const renderedFooterSlot = typeof footerSlot === 'function' ? footerSlot(footerContext) : footerSlot;

  const formulaSummary = enableFormulas && formulas.length > 0 ? (
    <div className={styles.formulas}>
      {formulas.map((formula) => (
        <span key={formula.label} className={styles.formulaBadge}>
          {formula.label}: {formula.compute(filteredItems)}
        </span>
      ))}
    </div>
  ) : null;

  const rootClassName = mergeClasses(
    styles.root,
    toMotionClass(styles, motion),
    lastHighlightKey !== null ? styles.syncGlow : undefined
  );

  const densityClassName = resolvedDensity === 'compact' ? styles.tableCompact : styles.tableRegular;

  return (
    <section className={rootClassName} aria-label="HBC Data Table container" data-component="HbcDataTable" data-table-id={tableId}>
      <div className={styles.shell}>
        {(enableBuiltInToolbar || renderedToolbarSlot) && (
          <div className={styles.toolbar}>
            {enableBuiltInToolbar && (
              <div className={styles.toolbarControls}>
                {enableFiltering && (
                  <Input
                    aria-label="Filter table rows"
                    value={resolvedFilter}
                    onChange={(_, data) => onFilterInput(data.value)}
                    placeholder={searchPlaceholder}
                  />
                )}

                {enableColumnVisibility && (
                  <Menu>
                    <MenuTrigger disableButtonEnhancement>
                      <Button type="button" aria-label="Toggle visible columns">Columns</Button>
                    </MenuTrigger>
                    <MenuPopover>
                      <MenuList>
                        {columns.map((column) => {
                          const checked = resolvedVisibility[column.key] ?? true;
                          return (
                            <MenuItem
                              key={column.key}
                              onClick={() => onVisibilityToggle(column.key, !checked)}
                            >
                              {checked ? 'Hide' : 'Show'} {column.header}
                            </MenuItem>
                          );
                        })}
                      </MenuList>
                    </MenuPopover>
                  </Menu>
                )}

                {enableGrouping && (
                  <Select
                    aria-label="Group rows by column"
                    value={resolvedGroupBy[0] ?? ''}
                    onChange={(event) => onGroupSelection(event.target.value)}
                  >
                    <option value="">No grouping</option>
                    {columns.map((column) => (
                      <option key={column.key} value={column.key}>{column.header}</option>
                    ))}
                  </Select>
                )}

                <Button type="button" aria-label="Toggle table density" onClick={onDensityToggle}>
                  {resolvedDensity === 'regular' ? 'Compact' : 'Regular'}
                </Button>
              </div>
            )}

            <div className={styles.toolbarMeta}>
              {filteredItems.length} of {items.length} row(s)
              {enableInlineEditing ? ' | Inline editing enabled' : ''}
            </div>
            {renderedToolbarSlot}
          </div>
        )}

        <div className={densityClassName}>
          <HbcTanStackTable<TData>
            columns={columns}
            items={items}
            keyExtractor={keyExtractor}
            isLoading={isLoading}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
            ariaLabel={ariaLabel}
            onRowClick={onTableRowClick}
            rowActions={rowActions}
            sortField={sortField}
            sortAsc={sortAsc}
            onSort={onSort}
            pageSize={pageSize}
            pageIndex={resolvedPageIndex}
            onPageIndexChange={onTablePageIndexChange}
            virtualization={virtualization}
            enableFiltering={enableFiltering}
            globalFilter={resolvedFilter}
            onGlobalFilterChange={onFilterInput}
            enableGrouping={enableGrouping}
            groupBy={resolvedGroupBy}
            onGroupByChange={(nextGroupBy) => {
              if (groupBy === undefined) {
                setInternalGroupBy(nextGroupBy);
              }
              onGroupByChange?.(nextGroupBy);
            }}
            enableColumnVisibility={enableColumnVisibility}
            columnVisibility={resolvedVisibility}
            onColumnVisibilityChange={(nextVisibility) => {
              if (columnVisibility === undefined) {
                setInternalVisibility(nextVisibility);
              }
              onColumnVisibilityChange?.(nextVisibility);
            }}
            enableRowSelection={enableRowSelection}
            selectedRowKeys={selectedRowKeys}
            onSelectedRowKeysChange={onSelectedRowKeysChange}
            enableColumnResize={enableColumnResize}
            columnSizing={resolvedColumnSizing}
            onColumnSizingChange={(nextSizing) => {
              if (columnSizing === undefined) {
                setInternalColumnSizing(nextSizing);
              }
              onColumnSizingChange?.(nextSizing);
            }}
          />
        </div>
      </div>

      {(enableBuiltInFooter || renderedFooterSlot || formulaSummary) && (
        <footer className={styles.footer}>
          {formulaSummary}
          {enableBuiltInFooter && (
            <div className={styles.footerMeta}>
              <span>Filtered rows: {filteredItems.length}</span>
              <span>Selected rows: {selectedItems.length}</span>
            </div>
          )}
          {renderedFooterSlot}
          {linkedChartId && lastHighlightKey !== null ? (
            <span className={styles.liveRegion} aria-live="polite">
              Linked visualization highlight active for row key {String(lastHighlightKey)}.
            </span>
          ) : null}
        </footer>
      )}
    </section>
  );
}
