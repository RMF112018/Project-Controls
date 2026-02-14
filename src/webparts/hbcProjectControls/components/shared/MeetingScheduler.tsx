import * as React from 'react';
import { HBC_COLORS, SPACING } from '../../theme/tokens';
import { IMeeting, ICalendarAvailability, ITimeSlot, MeetingType } from '@hbc/sp-services';
import { useMeetings } from '../hooks/useMeetings';
import { LoadingSpinner } from './LoadingSpinner';

export interface IMeetingSchedulerProps {
  meetingType: MeetingType;
  subject: string;
  attendeeEmails: string[];
  leadId?: number;
  projectCode?: string;
  startDate: string;   // ISO date e.g. '2026-02-09'
  endDate: string;     // ISO date e.g. '2026-02-13'
  onScheduled: (meeting: IMeeting) => void;
  onCancel?: () => void;
}

interface IDaySlots {
  date: string;
  label: string;
  slots: { time: string; label: string; availableCount: number; total: number; available: boolean[] }[];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function buildGrid(
  availability: ICalendarAvailability[],
  attendeeEmails: string[]
): IDaySlots[] {
  if (availability.length === 0) return [];

  // Collect all unique slot start times across all attendees
  const slotMap = new Map<string, { time: string; available: boolean[] }>();

  for (const person of availability) {
    const emailIndex = attendeeEmails.indexOf(person.email);
    if (emailIndex === -1) continue;

    for (const slot of person.slots) {
      const key = slot.start;
      if (!slotMap.has(key)) {
        slotMap.set(key, { time: slot.start, available: new Array(attendeeEmails.length).fill(false) as boolean[] });
      }
      const entry = slotMap.get(key)!;
      entry.available[emailIndex] = slot.available;
    }
  }

  // Group by day
  const dayMap = new Map<string, IDaySlots>();
  const sortedSlots = Array.from(slotMap.values()).sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  for (const slot of sortedSlots) {
    const dateStr = slot.time.split('T')[0];
    if (!dayMap.has(dateStr)) {
      dayMap.set(dateStr, {
        date: dateStr,
        label: formatDate(dateStr),
        slots: [],
      });
    }
    const availCount = slot.available.filter(Boolean).length;
    dayMap.get(dateStr)!.slots.push({
      time: slot.time,
      label: formatTime(slot.time),
      availableCount: availCount,
      total: attendeeEmails.length,
      available: slot.available,
    });
  }

  return Array.from(dayMap.values());
}

function getSlotColor(availableCount: number, total: number): string {
  if (total === 0) return HBC_COLORS.gray200;
  const ratio = availableCount / total;
  if (ratio === 1) return HBC_COLORS.success;
  if (ratio >= 0.5) return HBC_COLORS.warningLight;
  return HBC_COLORS.errorLight;
}

function getSlotBorder(availableCount: number, total: number): string {
  if (total === 0) return HBC_COLORS.gray300;
  const ratio = availableCount / total;
  if (ratio === 1) return HBC_COLORS.success;
  if (ratio >= 0.5) return HBC_COLORS.warning;
  return HBC_COLORS.error;
}

export function MeetingScheduler({
  meetingType,
  subject,
  attendeeEmails,
  leadId,
  projectCode,
  startDate,
  endDate,
  onScheduled,
  onCancel,
}: IMeetingSchedulerProps): React.ReactElement {
  const { availability, isLoading, error, fetchAvailability, createMeeting } = useMeetings();
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);
  const [scheduling, setScheduling] = React.useState(false);

  React.useEffect(() => {
    if (attendeeEmails.length > 0) {
      fetchAvailability(attendeeEmails, startDate, endDate).catch(console.error);
    }
  }, [attendeeEmails, startDate, endDate, fetchAvailability]);

  const grid = React.useMemo(
    () => buildGrid(availability, attendeeEmails),
    [availability, attendeeEmails]
  );

  const handleSchedule = React.useCallback(async () => {
    if (!selectedSlot) return;

    const slotStart = new Date(selectedSlot);
    const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // 1-hour meeting

    setScheduling(true);
    try {
      const meeting = await createMeeting({
        subject,
        type: meetingType,
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        attendees: attendeeEmails,
        leadId,
        projectCode,
      });
      onScheduled(meeting);
    } catch {
      // Error is captured in hook state
    } finally {
      setScheduling(false);
    }
  }, [selectedSlot, subject, meetingType, attendeeEmails, leadId, projectCode, createMeeting, onScheduled]);

  // Styles
  const containerStyle: React.CSSProperties = {
    padding: SPACING.lg,
    background: HBC_COLORS.white,
    borderRadius: '8px',
    border: `1px solid ${HBC_COLORS.gray200}`,
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    color: HBC_COLORS.navy,
    marginBottom: SPACING.md,
  };

  const legendStyle: React.CSSProperties = {
    display: 'flex',
    gap: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: '12px',
    color: HBC_COLORS.gray600,
  };

  const legendItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const legendSwatchStyle = (color: string): React.CSSProperties => ({
    width: '12px',
    height: '12px',
    borderRadius: '2px',
    background: color,
  });

  const gridContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: SPACING.md,
    overflowX: 'auto',
    marginBottom: SPACING.lg,
  };

  const dayColumnStyle: React.CSSProperties = {
    minWidth: '140px',
    flex: 1,
  };

  const dayHeaderStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: HBC_COLORS.navy,
    padding: '6px 8px',
    borderBottom: `2px solid ${HBC_COLORS.navy}`,
    marginBottom: SPACING.sm,
  };

  const slotStyle = (bg: string, border: string, isSelected: boolean): React.CSSProperties => ({
    padding: '8px 10px',
    marginBottom: '4px',
    borderRadius: '4px',
    background: bg,
    border: `2px solid ${isSelected ? HBC_COLORS.orange : border}`,
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'border-color 0.15s ease',
    outline: isSelected ? `2px solid ${HBC_COLORS.orange}` : 'none',
    outlineOffset: '1px',
  });

  const slotTimeStyle: React.CSSProperties = {
    fontWeight: 600,
    color: HBC_COLORS.gray800,
  };

  const slotCountStyle: React.CSSProperties = {
    fontSize: '11px',
    color: HBC_COLORS.gray500,
    marginTop: '2px',
  };

  const attendeeListStyle: React.CSSProperties = {
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    background: HBC_COLORS.gray50,
    borderRadius: '6px',
    fontSize: '13px',
    color: HBC_COLORS.gray700,
  };

  const buttonRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: SPACING.sm,
    justifyContent: 'flex-end',
  };

  const primaryBtnStyle: React.CSSProperties = {
    padding: '8px 20px',
    borderRadius: '6px',
    border: 'none',
    background: selectedSlot && !scheduling ? HBC_COLORS.orange : HBC_COLORS.gray300,
    color: selectedSlot && !scheduling ? HBC_COLORS.white : HBC_COLORS.gray500,
    fontWeight: 600,
    fontSize: '14px',
    cursor: selectedSlot && !scheduling ? 'pointer' : 'not-allowed',
  };

  const cancelBtnStyle: React.CSSProperties = {
    padding: '8px 20px',
    borderRadius: '6px',
    border: `1px solid ${HBC_COLORS.gray300}`,
    background: HBC_COLORS.white,
    color: HBC_COLORS.gray700,
    fontWeight: 500,
    fontSize: '14px',
    cursor: 'pointer',
  };

  if (isLoading && availability.length === 0) {
    return <LoadingSpinner label="Loading availability..." />;
  }

  if (error) {
    return (
      <div style={{ ...containerStyle, color: HBC_COLORS.error }}>
        Error loading availability: {error}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>Schedule {subject}</div>

      {/* Attendee list */}
      <div style={attendeeListStyle}>
        <strong>Attendees ({attendeeEmails.length}):</strong>{' '}
        {availability.map(a => a.displayName).join(', ') || attendeeEmails.join(', ')}
      </div>

      {/* Legend */}
      <div style={legendStyle}>
        <div style={legendItemStyle}>
          <span style={legendSwatchStyle(HBC_COLORS.success)} />
          All available
        </div>
        <div style={legendItemStyle}>
          <span style={legendSwatchStyle(HBC_COLORS.warningLight)} />
          Partial
        </div>
        <div style={legendItemStyle}>
          <span style={legendSwatchStyle(HBC_COLORS.errorLight)} />
          Most unavailable
        </div>
      </div>

      {/* Availability grid */}
      {grid.length === 0 ? (
        <div style={{ textAlign: 'center', padding: SPACING.xl, color: HBC_COLORS.gray500 }}>
          No availability data found for the selected date range.
        </div>
      ) : (
        <div style={gridContainerStyle}>
          {grid.map(day => (
            <div key={day.date} style={dayColumnStyle}>
              <div style={dayHeaderStyle}>{day.label}</div>
              {day.slots.map(slot => {
                const bg = getSlotColor(slot.availableCount, slot.total);
                const border = getSlotBorder(slot.availableCount, slot.total);
                const isSelected = selectedSlot === slot.time;
                return (
                  <div
                    key={slot.time}
                    style={slotStyle(bg, border, isSelected)}
                    onClick={() => setSelectedSlot(slot.time)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedSlot(slot.time); }}
                  >
                    <div style={slotTimeStyle}>{slot.label}</div>
                    <div style={slotCountStyle}>
                      {slot.availableCount}/{slot.total} available
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={buttonRowStyle}>
        {onCancel && (
          <button style={cancelBtnStyle} onClick={onCancel} type="button">
            Cancel
          </button>
        )}
        <button
          style={primaryBtnStyle}
          onClick={handleSchedule}
          disabled={!selectedSlot || scheduling}
          type="button"
        >
          {scheduling ? 'Scheduling...' : 'Schedule Meeting'}
        </button>
      </div>
    </div>
  );
}
