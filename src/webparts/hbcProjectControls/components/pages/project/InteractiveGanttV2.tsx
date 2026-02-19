import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  EntityType,
  IScheduleActivity,
  IFieldReadinessScore,
  ScheduleEngine,
} from '@hbc/sp-services';
import { HBC_COLORS, ELEVATION } from '../../../theme/tokens';
import { useAppContext } from '../../contexts/AppContext';
import { useSignalRContext } from '../../contexts/SignalRContext';
import { useSignalR } from '../../hooks/useSignalR';
import { useToast } from '../../shared/ToastContainer';
import { useHbcOptimisticMutation } from '../../../tanstack/query/mutations/useHbcOptimisticMutation';

interface IInteractiveGanttV2Props {
  projectCode: string;
  activities: IScheduleActivity[];
  fieldReadiness: IFieldReadinessScore | null;
  onFieldReadinessRefresh: () => void;
}

type DragMode = 'move' | 'resize-left' | 'resize-right';

interface IDragState {
  id: number;
  mode: DragMode;
  startX: number;
  startDate: Date;
  finishDate: Date;
}

const ROW_HEIGHT = 42;
const VIRTUAL_HEIGHT = 440;
const DAY_WIDTH = 20;

function toDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toIsoDate(value: Date): string {
  return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())).toISOString();
}

function addDays(value: Date, days: number): Date {
  const d = new Date(value);
  d.setDate(d.getDate() + days);
  return d;
}

function diffDays(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

export const InteractiveGanttV2: React.FC<IInteractiveGanttV2Props> = ({
  projectCode,
  activities,
  fieldReadiness,
  onFieldReadinessRefresh,
}) => {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const { addToast } = useToast();
  const engineRef = React.useRef(new ScheduleEngine());
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const focusedRowIdRef = React.useRef<number | null>(null);
  const [rows, setRows] = React.useState<IScheduleActivity[]>(activities);
  const [drag, setDrag] = React.useState<IDragState | null>(null);
  const [linkSourceKey, setLinkSourceKey] = React.useState<string | null>(null);
  const [politeLive, setPoliteLive] = React.useState('');
  const [assertiveLive, setAssertiveLive] = React.useState('');

  React.useEffect(() => setRows(activities), [activities]);

  React.useEffect(() => {
    if (!focusedRowIdRef.current) return;
    const node = containerRef.current?.querySelector<HTMLElement>(`[data-gantt-row-id="${focusedRowIdRef.current}"]`);
    if (node && document.activeElement !== node) {
      node.focus({ preventScroll: true });
    }
  }, [rows]);

  useSignalR({
    entityType: EntityType.ScheduleActivity,
    projectCode,
    onEntityChanged: () => {
      onFieldReadinessRefresh();
      setPoliteLive('Field readiness and schedule state refreshed from real-time update.');
    },
  });
  useSignalR({
    entityType: EntityType.ScheduleFieldLink,
    projectCode,
    onEntityChanged: () => {
      onFieldReadinessRefresh();
      setPoliteLive('Field readiness refreshed from linkage update.');
    },
  });

  const dateRange = React.useMemo(() => {
    const starts = rows.map(r => toDate(r.plannedStartDate || r.actualStartDate)).filter(Boolean) as Date[];
    const ends = rows.map(r => toDate(r.plannedFinishDate || r.actualFinishDate)).filter(Boolean) as Date[];
    const min = starts.length ? new Date(Math.min(...starts.map(d => d.getTime()))) : new Date();
    const max = ends.length ? new Date(Math.max(...ends.map(d => d.getTime()))) : addDays(min, 30);
    return { min, max, totalDays: Math.max(1, diffDays(min, max) + 1) };
  }, [rows]);

  const sortedRows = React.useMemo(
    () => [...rows].sort((a, b) => {
      const aStart = toDate(a.plannedStartDate || a.actualStartDate)?.getTime() || 0;
      const bStart = toDate(b.plannedStartDate || b.actualStartDate)?.getTime() || 0;
      return aStart - bStart;
    }),
    [rows],
  );

  const virtualizer = useVirtualizer({
    count: sortedRows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });

  const geometryById = React.useMemo(() => {
    const map = new Map<number, { leftPx: number; widthPx: number; startDate: Date; finishDate: Date }>();
    sortedRows.forEach(row => {
      const start = toDate(row.plannedStartDate || row.actualStartDate) || dateRange.min;
      const finish = toDate(row.plannedFinishDate || row.actualFinishDate) || addDays(start, Math.max(1, row.originalDuration));
      const leftPx = diffDays(dateRange.min, start) * DAY_WIDTH;
      const widthPx = Math.max(DAY_WIDTH, (diffDays(start, finish) + 1) * DAY_WIDTH);
      map.set(row.id, { leftPx, widthPx, startDate: start, finishDate: finish });
    });
    return map;
  }, [dateRange.min, sortedRows]);

  const updateMutation = useHbcOptimisticMutation<IScheduleActivity, { activityId: number; patch: Partial<IScheduleActivity> }, IScheduleActivity[]>({
    method: 'updateScheduleActivity',
    domainFlag: 'ScheduleInteractiveGanttV1',
    mutationFn: async ({ activityId, patch }) => dataService.updateScheduleActivity(projectCode, activityId, patch),
  });

  const announce = React.useCallback((message: string, tone: 'polite' | 'assertive' = 'polite') => {
    if (tone === 'assertive') setAssertiveLive(message);
    else setPoliteLive(message);
  }, []);

  const applyActivityPatch = React.useCallback(async (activityId: number, patch: Partial<IScheduleActivity>, summary: string) => {
    const previous = rows;
    setRows(prev => prev.map(r => (r.id === activityId ? { ...r, ...patch } : r)));
    try {
      const updated = await updateMutation.mutateAsync({ activityId, patch });
      setRows(prev => prev.map(r => (r.id === activityId ? updated : r)));
      broadcastChange({
        type: 'EntityChanged',
        entityType: EntityType.ScheduleActivity,
        entityId: String(activityId),
        action: 'updated',
        changedBy: currentUser?.email || 'unknown',
        changedByName: currentUser?.displayName,
        timestamp: new Date().toISOString(),
        summary,
        projectCode,
      });
      announce(summary, 'polite');
    } catch (err) {
      setRows(previous);
      announce('Update failed and was rolled back.', 'assertive');
      addToast(err instanceof Error ? err.message : 'Failed to update schedule activity', 'error');
    } finally {
      onFieldReadinessRefresh();
    }
  }, [rows, updateMutation, broadcastChange, currentUser?.email, currentUser?.displayName, projectCode, onFieldReadinessRefresh, announce, addToast]);

  const connectPredecessor = React.useCallback(async (sourceKey: string, targetId: number) => {
    const source = rows.find(r => r.externalActivityKey === sourceKey);
    const target = rows.find(r => r.id === targetId);
    if (!source || !target || !source.externalActivityKey || !target.externalActivityKey) {
      announce('Linking failed: source or target identity missing.', 'assertive');
      return;
    }
    if (source.id === target.id) {
      announce('Linking failed: cannot link activity to itself.', 'assertive');
      return;
    }
    if (target.predecessors.includes(source.taskCode)) {
      announce('Linking skipped: predecessor already exists.', 'assertive');
      return;
    }

    const patchedRows = rows.map(r => {
      if (r.id === source.id) {
        return {
          ...r,
          successors: Array.from(new Set([...r.successors, target.taskCode])),
          successorDetails: Array.from(new Set([...r.successorDetails.map(s => `${s.taskCode}:${s.relationshipType}:${s.lag}`), `${target.taskCode}:FS:0`]))
            .map(token => {
              const [taskCode, relationshipType, lag] = token.split(':');
              return { taskCode, relationshipType: relationshipType as 'FS' | 'FF' | 'SS' | 'SF', lag: parseInt(lag, 10) || 0 };
            }),
        };
      }
      if (r.id === target.id) {
        return { ...r, predecessors: [...r.predecessors, source.taskCode] };
      }
      return r;
    });

    const diag = engineRef.current.analyzeDag(projectCode, patchedRows);
    if (diag.hasCycle) {
      announce('Link blocked: would introduce cycle.', 'assertive');
      addToast('Link blocked: cycle detected by DAG diagnostic', 'error');
      return;
    }

    const sourcePatch = patchedRows.find(r => r.id === source.id);
    const targetPatch = patchedRows.find(r => r.id === target.id);
    if (!sourcePatch || !targetPatch) return;

    const previous = rows;
    setRows(patchedRows);
    try {
      await Promise.all([
        dataService.updateScheduleActivity(projectCode, source.id, {
          successors: sourcePatch.successors,
          successorDetails: sourcePatch.successorDetails,
        }),
        dataService.updateScheduleActivity(projectCode, target.id, {
          predecessors: targetPatch.predecessors,
        }),
      ]);
      broadcastChange({
        type: 'EntityChanged',
        entityType: EntityType.ScheduleActivity,
        entityId: String(target.id),
        action: 'updated',
        changedBy: currentUser?.email || 'unknown',
        changedByName: currentUser?.displayName,
        timestamp: new Date().toISOString(),
        summary: `Linked ${source.taskCode} -> ${target.taskCode}`,
        projectCode,
      });
      announce(`Created predecessor link ${source.taskCode} -> ${target.taskCode}`, 'polite');
    } catch (err) {
      setRows(previous);
      announce('Link update failed and was rolled back.', 'assertive');
      addToast(err instanceof Error ? err.message : 'Failed to create predecessor link', 'error');
    } finally {
      onFieldReadinessRefresh();
    }
  }, [rows, projectCode, announce, addToast, dataService, broadcastChange, currentUser?.email, currentUser?.displayName, onFieldReadinessRefresh]);

  const beginDrag = React.useCallback((id: number, mode: DragMode, clientX: number) => {
    const geo = geometryById.get(id);
    if (!geo) return;
    setDrag({
      id,
      mode,
      startX: clientX,
      startDate: geo.startDate,
      finishDate: geo.finishDate,
    });
  }, [geometryById]);

  const onPointerMove = React.useCallback((ev: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const dayDelta = Math.round((ev.clientX - drag.startX) / DAY_WIDTH);
      setRows(prev => prev.map(r => {
        if (r.id !== drag.id) return r;
        const start = drag.startDate;
        const finish = drag.finishDate;
        if (drag.mode === 'move') {
          return { ...r, plannedStartDate: toIsoDate(addDays(start, dayDelta)), plannedFinishDate: toIsoDate(addDays(finish, dayDelta)) };
        }
        if (drag.mode === 'resize-left') {
          const resizedStart = addDays(start, dayDelta);
          if (resizedStart >= finish) return r;
          return {
            ...r,
            plannedStartDate: toIsoDate(resizedStart),
            originalDuration: Math.max(1, diffDays(resizedStart, finish) + 1),
          };
        }
        const resizedFinish = addDays(finish, dayDelta);
        if (resizedFinish <= start) return r;
        return {
          ...r,
          plannedFinishDate: toIsoDate(resizedFinish),
          originalDuration: Math.max(1, diffDays(start, resizedFinish) + 1),
        };
      }));
    });
  }, [drag]);

  const onPointerUp = React.useCallback(() => {
    if (!drag) return;
    const row = rows.find(r => r.id === drag.id);
    setDrag(null);
    if (!row) return;
    void applyActivityPatch(row.id, {
      plannedStartDate: row.plannedStartDate,
      plannedFinishDate: row.plannedFinishDate,
      originalDuration: row.originalDuration,
      remainingDuration: Math.max(0, row.originalDuration - row.actualDuration),
    }, `Updated ${row.taskCode} schedule geometry`);
  }, [drag, rows, applyActivityPatch]);

  React.useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const keyboardMove = React.useCallback((row: IScheduleActivity, dayDelta: number) => {
    const start = toDate(row.plannedStartDate || row.actualStartDate) || dateRange.min;
    const finish = toDate(row.plannedFinishDate || row.actualFinishDate) || addDays(start, Math.max(1, row.originalDuration));
    void applyActivityPatch(row.id, {
      plannedStartDate: toIsoDate(addDays(start, dayDelta)),
      plannedFinishDate: toIsoDate(addDays(finish, dayDelta)),
    }, `Moved ${row.taskCode} by ${dayDelta} day(s)`);
  }, [applyActivityPatch, dateRange.min]);

  const keyboardResize = React.useCallback((row: IScheduleActivity, delta: number) => {
    const start = toDate(row.plannedStartDate || row.actualStartDate) || dateRange.min;
    const finish = toDate(row.plannedFinishDate || row.actualFinishDate) || addDays(start, Math.max(1, row.originalDuration));
    const nextFinish = addDays(finish, delta);
    if (nextFinish <= start) return;
    const nextDuration = Math.max(1, diffDays(start, nextFinish) + 1);
    void applyActivityPatch(row.id, {
      plannedFinishDate: toIsoDate(nextFinish),
      originalDuration: nextDuration,
      remainingDuration: Math.max(0, nextDuration - row.actualDuration),
    }, `Resized ${row.taskCode} duration`);
  }, [applyActivityPatch, dateRange.min]);

  const totalWidth = Math.max(600, dateRange.totalDays * DAY_WIDTH + 80);
  const virtualItems = virtualizer.getVirtualItems();
  const heavyMode = sortedRows.length > 5000;

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: HBC_COLORS.navy }}>Interactive Gantt v2</div>
          <div style={{ fontSize: 12, color: HBC_COLORS.gray500 }}>
            Virtualized rendering for {sortedRows.length.toLocaleString()} rows, optimized for 5,000+ activities.
          </div>
        </div>
        <button onClick={onFieldReadinessRefresh} style={btnSecondary}>Refresh Field Readiness</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(120px, 1fr))', gap: 10, marginBottom: 10 }}>
        <Metric label="Field Readiness Score" value={fieldReadiness ? `${fieldReadiness.score}` : 'N/A'} />
        <Metric label="Linkage %" value={fieldReadiness ? `${fieldReadiness.linkageCoveragePct}%` : 'N/A'} />
        <Metric label="PPC Proxy" value={fieldReadiness ? `${fieldReadiness.ppcProxy}%` : 'N/A'} />
        <Metric label="Constraint Penalty" value={fieldReadiness ? `${fieldReadiness.openConstraintPenalty}%` : 'N/A'} />
        <Metric label="Permit Penalty" value={fieldReadiness ? `${fieldReadiness.openPermitPenalty}%` : 'N/A'} />
      </div>

      <p id="gantt-keyboard-hint" style={{ fontSize: 11, color: HBC_COLORS.gray600, margin: '0 0 8px 0' }}>
        Keyboard: Arrow keys move by day, Shift+Arrow moves by week, Alt+Arrow resizes, L sets link source, Enter commits link target.
      </p>
      <div aria-live="polite" style={srOnly}>{politeLive}</div>
      <div aria-live="assertive" style={srOnly}>{assertiveLive}</div>

      <div
        ref={containerRef}
        style={{ height: VIRTUAL_HEIGHT, overflow: 'auto', border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 6 }}
        role="region"
        aria-label="Interactive Gantt chart"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div style={{ height: virtualizer.getTotalSize(), width: totalWidth, position: 'relative' }}>
          {virtualItems.map(virtualItem => {
            const row = sortedRows[virtualItem.index];
            const geo = geometryById.get(row.id);
            if (!geo) return null;
            const percent = Math.max(0, Math.min(100, row.percentComplete));
            return (
              <div
                key={row.id}
                role="row"
                data-gantt-row-id={row.id}
                aria-label={`${row.taskCode} ${row.activityName}, ${percent}% complete`}
                aria-describedby="gantt-keyboard-hint"
                tabIndex={0}
                onFocus={() => {
                  focusedRowIdRef.current = row.id;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' && !e.altKey) {
                    e.preventDefault();
                    keyboardMove(row, e.shiftKey ? 7 : 1);
                  } else if (e.key === 'ArrowLeft' && !e.altKey) {
                    e.preventDefault();
                    keyboardMove(row, e.shiftKey ? -7 : -1);
                  } else if (e.key === 'ArrowRight' && e.altKey) {
                    e.preventDefault();
                    keyboardResize(row, e.shiftKey ? 7 : 1);
                  } else if (e.key === 'ArrowLeft' && e.altKey) {
                    e.preventDefault();
                    keyboardResize(row, e.shiftKey ? -7 : -1);
                  } else if (e.key.toLowerCase() === 'l') {
                    e.preventDefault();
                    setLinkSourceKey(row.externalActivityKey || null);
                    announce(`Link source set to ${row.taskCode}`, 'polite');
                  } else if (e.key === 'Enter' && linkSourceKey) {
                    e.preventDefault();
                    void connectPredecessor(linkSourceKey, row.id);
                    setLinkSourceKey(null);
                  }
                }}
                style={{
                  position: 'absolute',
                  top: virtualItem.start,
                  left: 0,
                  width: '100%',
                  height: ROW_HEIGHT - 2,
                  borderBottom: `1px solid ${HBC_COLORS.gray100}`,
                  outline: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', height: '100%', position: 'relative' }}>
                  <div style={{ width: 220, padding: '0 8px', fontSize: 12, color: HBC_COLORS.gray700 }}>
                    <b>{row.taskCode}</b> {row.activityName}
                  </div>
                  <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                    {!heavyMode && (
                      <div style={{ position: 'absolute', left: geo.leftPx + geo.widthPx / 2, top: 0, bottom: 0, borderLeft: `1px dashed ${HBC_COLORS.gray200}` }} />
                    )}
                    <div
                      role="button"
                      aria-label={`Drag task ${row.taskCode}`}
                      tabIndex={-1}
                      onPointerDown={(e) => {
                        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                        beginDrag(row.id, 'move', e.clientX);
                      }}
                      onMouseUp={() => {
                        if (linkSourceKey) {
                          void connectPredecessor(linkSourceKey, row.id);
                          setLinkSourceKey(null);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        left: geo.leftPx,
                        top: 8,
                        width: geo.widthPx,
                        height: 24,
                        borderRadius: 6,
                        backgroundColor: row.isCritical ? HBC_COLORS.error : HBC_COLORS.navy,
                        display: 'flex',
                        alignItems: 'center',
                        color: '#fff',
                        cursor: 'grab',
                        userSelect: 'none',
                        transform: drag?.id === row.id && drag.mode === 'move' ? 'translateZ(0)' : undefined,
                      }}
                    >
                      <button
                        type="button"
                        aria-label={`Resize start ${row.taskCode}`}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                          beginDrag(row.id, 'resize-left', e.clientX);
                        }}
                        style={resizeHandleLeft}
                      />
                      <div style={{ flex: 1, padding: '0 8px', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.activityName}
                      </div>
                      <button
                        type="button"
                        aria-label={`Resize end ${row.taskCode}`}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                          beginDrag(row.id, 'resize-right', e.clientX);
                        }}
                        style={resizeHandleRight}
                      />
                    </div>

                    <button
                      type="button"
                      aria-label={`Set link source ${row.taskCode}`}
                      onClick={() => {
                        setLinkSourceKey(row.externalActivityKey || null);
                        announce(`Link source set to ${row.taskCode}`, 'polite');
                      }}
                      style={{
                        position: 'absolute',
                        left: Math.max(0, geo.leftPx - 10),
                        top: 16,
                        width: 10,
                        height: 10,
                        borderRadius: 10,
                        border: 'none',
                        backgroundColor: linkSourceKey === row.externalActivityKey ? HBC_COLORS.warning : HBC_COLORS.info,
                        cursor: 'pointer',
                      }}
                    />

                    <div style={{ position: 'absolute', left: geo.leftPx + geo.widthPx + 8, top: 10, width: 130 }}>
                      <label style={{ display: 'block', fontSize: 10, color: HBC_COLORS.gray600 }}>
                        Progress {percent}%
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={percent}
                          aria-label={`Progress for ${row.taskCode}`}
                          onChange={(e) => {
                            const next = parseInt(e.target.value, 10) || 0;
                            setRows(prev => prev.map(r => (r.id === row.id ? { ...r, percentComplete: next } : r)));
                          }}
                          onMouseUp={() => {
                            const latest = rows.find(r => r.id === row.id);
                            if (!latest) return;
                            void applyActivityPatch(row.id, { percentComplete: latest.percentComplete }, `Updated ${row.taskCode} progress`);
                          }}
                          onKeyUp={(e) => {
                            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                              const latest = rows.find(r => r.id === row.id);
                              if (!latest) return;
                              void applyActivityPatch(row.id, { percentComplete: latest.percentComplete }, `Updated ${row.taskCode} progress`);
                            }
                          }}
                          style={{ width: '100%' }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 6, padding: 8, backgroundColor: '#fff' }}>
    <div style={{ fontSize: 11, color: HBC_COLORS.gray500 }}>{label}</div>
    <div style={{ fontSize: 17, fontWeight: 700, color: HBC_COLORS.navy }}>{value}</div>
  </div>
);

const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: 8,
  border: `1px solid ${HBC_COLORS.gray200}`,
  padding: 16,
  boxShadow: ELEVATION.level1,
};

const btnSecondary: React.CSSProperties = {
  padding: '7px 12px',
  borderRadius: 6,
  border: `1px solid ${HBC_COLORS.gray300}`,
  backgroundColor: '#fff',
  color: HBC_COLORS.navy,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

const srOnly: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  border: 0,
};

const resizeHandleLeft: React.CSSProperties = {
  width: 8,
  height: '100%',
  border: 'none',
  background: 'rgba(255,255,255,0.45)',
  borderTopLeftRadius: 6,
  borderBottomLeftRadius: 6,
  cursor: 'ew-resize',
};

const resizeHandleRight: React.CSSProperties = {
  width: 8,
  height: '100%',
  border: 'none',
  background: 'rgba(255,255,255,0.45)',
  borderTopRightRadius: 6,
  borderBottomRightRadius: 6,
  cursor: 'ew-resize',
};
