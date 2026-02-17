import * as React from 'react';
import { IChecklistSection, IStartupChecklistSummary, ChecklistStatus, ChecklistResponseType } from '@hbc/sp-services';
import { HBC_COLORS, ELEVATION } from '../../theme/tokens';
import { ExportButtons } from './ExportButtons';
import { PageHeader } from './PageHeader';
import { Breadcrumb } from './Breadcrumb';
import { SkeletonLoader } from './SkeletonLoader';

/* ---------- Types ---------- */

/** Unified item shape accepted by ChecklistTable */
export interface IChecklistTableItem {
  id: number;
  sectionNumber: number;
  sectionName: string;
  itemNumber: string;
  label: string;
  responseType: ChecklistResponseType;
  response: string | number | null;
  status: string;
  comment?: string | null;
  isCustom: boolean;
  hbShare?: number;
  amount?: number;
  period?: string;
  dateValue?: string;
  calculatedFrom?: string;
  placeholder?: string;
  details?: string;
}

export interface IChecklistTableProps {
  title: string;
  subtitle?: string;
  breadcrumb?: Array<{ label: string; path?: string }>;
  sections: IChecklistSection[];
  items: IChecklistTableItem[];
  isLoading?: boolean;
  canEdit: boolean;
  canSignOff?: boolean;
  onResponseChange: (itemId: number, data: Partial<IChecklistTableItem>) => void;
  onCommentChange: (itemId: number, comment: string) => void;
  onAddItem?: (sectionNumber: number, item: Partial<IChecklistTableItem>) => void;
  onRemoveItem?: (itemId: number) => void;
  onSignOff?: () => void;
  exportFilename: string;
  allItems?: IChecklistTableItem[];
}

/* ---------- Styles ---------- */

const cardStyle: React.CSSProperties = {
  backgroundColor: HBC_COLORS.white,
  borderRadius: '8px',
  boxShadow: ELEVATION.level1,
  padding: '24px',
  marginBottom: '16px',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const sectionHeaderStyle: React.CSSProperties = {
  backgroundColor: HBC_COLORS.navy,
  color: HBC_COLORS.white,
  fontSize: '13px',
  fontWeight: 600,
  padding: '10px 12px',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: `1px solid ${HBC_COLORS.gray200}`,
  fontSize: '13px',
  color: HBC_COLORS.gray800,
  verticalAlign: 'top',
};

const itemNumberStyle: React.CSSProperties = {
  ...tdStyle,
  width: '60px',
  fontFamily: 'monospace',
  color: HBC_COLORS.gray500,
};

const descriptionStyle: React.CSSProperties = {
  ...tdStyle,
  minWidth: '250px',
};

const responseColStyle: React.CSSProperties = {
  ...tdStyle,
  width: '200px',
};

const commentColStyle: React.CSSProperties = {
  ...tdStyle,
  width: '200px',
};

/* ---------- Badge ---------- */

const badgeColors: Record<string, { bg: string; text: string }> = {
  Conforming: { bg: HBC_COLORS.successLight, text: '#065F46' },
  Deficient: { bg: HBC_COLORS.errorLight, text: '#991B1B' },
  NA: { bg: HBC_COLORS.gray100, text: HBC_COLORS.gray600 },
  Neutral: { bg: HBC_COLORS.infoLight, text: '#1E40AF' },
  NoResponse: { bg: HBC_COLORS.warningLight, text: '#92400E' },
};

function SummaryBadge({ label, count, colorKey }: { label: string; count: number; colorKey: string }): React.ReactElement {
  const c = badgeColors[colorKey] || badgeColors.NoResponse;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
      backgroundColor: c.bg, color: c.text, marginRight: '6px',
    }}>
      {label}: {count}
    </span>
  );
}

/* ---------- Response button ---------- */

const RESPONSE_OPTIONS: Array<{ value: ChecklistStatus; label: string; bg: string; border: string; text: string }> = [
  { value: 'NA', label: 'N/A', bg: HBC_COLORS.gray100, border: HBC_COLORS.gray400, text: HBC_COLORS.gray700 },
  { value: 'Conforming', label: 'Yes', bg: HBC_COLORS.successLight, border: HBC_COLORS.success, text: '#065F46' },
  { value: 'Deficient', label: 'No', bg: HBC_COLORS.errorLight, border: HBC_COLORS.error, text: '#991B1B' },
];

function YesNoNAButtons({
  value, canEdit, onChange,
}: {
  value: string | null; canEdit: boolean; onChange: (status: ChecklistStatus) => void;
}): React.ReactElement {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {RESPONSE_OPTIONS.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={!canEdit}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
              cursor: canEdit ? 'pointer' : 'default',
              border: `1.5px solid ${active ? opt.border : HBC_COLORS.gray200}`,
              backgroundColor: active ? opt.bg : HBC_COLORS.white,
              color: active ? opt.text : HBC_COLORS.gray400,
              transition: 'all 150ms ease',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Response renderers ---------- */

function renderResponse(
  item: IChecklistTableItem,
  canEdit: boolean,
  onResponseChange: IChecklistTableProps['onResponseChange'],
  allItems?: IChecklistTableItem[],
): React.ReactNode {
  const { responseType } = item;

  switch (responseType) {
    case 'yesNoNA':
    case 'yesNoWithComment':
      return (
        <YesNoNAButtons
          value={item.status}
          canEdit={canEdit}
          onChange={(status) => {
            const response = status;
            onResponseChange(item.id, { status, response });
          }}
        />
      );

    case 'percent':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input
            type="number"
            min={0}
            max={100}
            value={item.hbShare ?? ''}
            disabled={!canEdit}
            placeholder="0"
            onChange={(e) => {
              const val = e.target.value === '' ? undefined : Number(e.target.value);
              onResponseChange(item.id, {
                hbShare: val,
                status: val !== undefined ? 'Conforming' : 'NoResponse',
                response: val !== undefined ? 'Conforming' : null,
              } as Partial<IChecklistTableItem>);
            }}
            style={{
              width: '60px', padding: '4px 6px', borderRadius: '4px',
              border: `1px solid ${HBC_COLORS.gray300}`, fontSize: '13px',
              textAlign: 'right',
            }}
          />
          <span style={{ fontSize: '13px', color: HBC_COLORS.gray600 }}>% HB Share</span>
        </div>
      );

    case 'currency':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <span style={{ fontSize: '13px', color: HBC_COLORS.gray600 }}>$</span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={item.amount ?? ''}
            disabled={!canEdit}
            placeholder="0.00"
            onChange={(e) => {
              const val = e.target.value === '' ? undefined : Number(e.target.value);
              onResponseChange(item.id, {
                amount: val,
                status: val !== undefined ? 'Conforming' : 'NoResponse',
                response: val !== undefined ? 'Conforming' : null,
              } as Partial<IChecklistTableItem>);
            }}
            style={{
              width: '100px', padding: '4px 6px', borderRadius: '4px',
              border: `1px solid ${HBC_COLORS.gray300}`, fontSize: '13px',
              textAlign: 'right',
            }}
          />
        </div>
      );

    case 'currencyWithPeriod':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: HBC_COLORS.gray600 }}>$</span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={item.amount ?? ''}
            disabled={!canEdit}
            placeholder="0.00"
            onChange={(e) => {
              const val = e.target.value === '' ? undefined : Number(e.target.value);
              onResponseChange(item.id, {
                amount: val,
                status: val !== undefined ? 'Conforming' : 'NoResponse',
                response: val !== undefined ? 'Conforming' : null,
              } as Partial<IChecklistTableItem>);
            }}
            style={{
              width: '80px', padding: '4px 6px', borderRadius: '4px',
              border: `1px solid ${HBC_COLORS.gray300}`, fontSize: '13px',
              textAlign: 'right',
            }}
          />
          <span style={{ fontSize: '12px', color: HBC_COLORS.gray500 }}>per</span>
          <select
            value={item.period || ''}
            disabled={!canEdit}
            onChange={(e) => onResponseChange(item.id, { period: e.target.value })}
            style={{
              padding: '4px 6px', borderRadius: '4px',
              border: `1px solid ${HBC_COLORS.gray300}`, fontSize: '12px',
            }}
          >
            <option value="">Select</option>
            {['Day', 'Week', 'Month', 'Quarter', 'Year'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      );

    case 'date':
      return (
        <input
          type="date"
          value={item.dateValue ? item.dateValue.substring(0, 10) : ''}
          disabled={!canEdit}
          onChange={(e) => {
            const val = e.target.value || undefined;
            onResponseChange(item.id, {
              dateValue: val ? new Date(val).toISOString() : undefined,
              status: val ? 'Conforming' : 'NoResponse',
              response: val ? 'Conforming' : null,
            } as Partial<IChecklistTableItem>);
          }}
          style={{
            padding: '4px 6px', borderRadius: '4px',
            border: `1px solid ${HBC_COLORS.gray300}`, fontSize: '13px',
          }}
        />
      );

    case 'calculatedDate': {
      let computedDate = '';
      if (item.calculatedFrom && allItems) {
        const source = allItems.find(i => i.itemNumber === item.calculatedFrom);
        if (source?.dateValue) {
          const d = new Date(source.dateValue);
          d.setDate(d.getDate() + 80);
          computedDate = d.toLocaleDateString('en-US');
        }
      }
      return (
        <span style={{ fontSize: '13px', color: HBC_COLORS.gray600, fontStyle: 'italic' }}>
          {computedDate || 'Awaiting source date'}
        </span>
      );
    }

    case 'textInput':
      return (
        <input
          type="text"
          value={typeof item.response === 'string' ? item.response : ''}
          disabled={!canEdit}
          placeholder="Enter text"
          onChange={(e) => onResponseChange(item.id, {
            response: e.target.value || null,
            status: e.target.value ? 'Conforming' : 'NoResponse',
          })}
          style={{
            width: '180px', padding: '4px 6px', borderRadius: '4px',
            border: `1px solid ${HBC_COLORS.gray300}`, fontSize: '13px',
          }}
        />
      );

    case 'numeric':
      return (
        <input
          type="number"
          value={typeof item.response === 'number' ? item.response : ''}
          disabled={!canEdit}
          placeholder="0"
          onChange={(e) => {
            const val = e.target.value === '' ? null : Number(e.target.value);
            onResponseChange(item.id, {
              response: val,
              status: val !== null ? 'Conforming' : 'NoResponse',
            });
          }}
          style={{
            width: '120px', padding: '4px 6px', borderRadius: '4px',
            border: `1px solid ${HBC_COLORS.gray300}`, fontSize: '13px',
          }}
        />
      );

    default:
      return null;
  }
}

/* ---------- Summary computation ---------- */

function computeSummary(items: IChecklistTableItem[]): IStartupChecklistSummary {
  return {
    total: items.length,
    conforming: items.filter(i => i.status === 'Conforming').length,
    deficient: items.filter(i => i.status === 'Deficient').length,
    na: items.filter(i => i.status === 'NA').length,
    neutral: items.filter(i => i.status === 'Neutral').length,
    noResponse: items.filter(i => i.status === 'NoResponse').length,
  };
}

/* ---------- Component ---------- */

export const ChecklistTable: React.FC<IChecklistTableProps> = ({
  title, subtitle, breadcrumb, sections, items, isLoading, canEdit, canSignOff,
  onResponseChange, onCommentChange, onAddItem, onRemoveItem, onSignOff,
  exportFilename, allItems,
}) => {
  const [editingDetails, setEditingDetails] = React.useState<number | null>(null);
  const [detailsText, setDetailsText] = React.useState('');
  const resolvedItems = allItems || items;
  const summary = computeSummary(items);
  const responded = summary.total - summary.noResponse;
  const progressPct = summary.total > 0 ? Math.round((responded / summary.total) * 100) : 0;

  // Flatten items for export
  const exportData = items.map(i => ({
    Section: `${i.sectionNumber}. ${i.sectionName}`,
    Item: i.itemNumber,
    Description: i.label,
    Status: i.status,
    Response: i.response ?? '',
    Comment: i.comment ?? '',
    Details: i.details ?? '',
  }));

  if (isLoading) {
    return (
      <div>
        <PageHeader title={title} subtitle={subtitle} />
        <SkeletonLoader variant="table" rows={12} columns={4} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumb={breadcrumb ? <Breadcrumb items={breadcrumb} /> : undefined}
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {canSignOff && onSignOff && (
              <button
                type="button"
                onClick={onSignOff}
                style={{
                  padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                  backgroundColor: HBC_COLORS.navy, color: HBC_COLORS.white,
                  border: 'none', cursor: 'pointer',
                }}
              >
                Sign Off
              </button>
            )}
            <ExportButtons
              pdfElementId="checklist-export"
              data={exportData}
              filename={exportFilename}
              title={title}
            />
          </div>
        }
      />

      <div id="checklist-export">
        {/* Summary card */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: HBC_COLORS.gray800 }}>
              Items Completed: {responded}/{summary.total}
            </span>
            <span style={{ fontSize: '13px', color: HBC_COLORS.gray500 }}>{progressPct}%</span>
          </div>
          <div style={{
            height: '8px', backgroundColor: HBC_COLORS.gray100, borderRadius: '4px', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${progressPct}%`,
              backgroundColor: HBC_COLORS.navy, borderRadius: '4px',
              transition: 'width 300ms ease',
            }} />
          </div>
          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap' }}>
            <SummaryBadge label="Conforming" count={summary.conforming} colorKey="Conforming" />
            <SummaryBadge label="Deficient" count={summary.deficient} colorKey="Deficient" />
            <SummaryBadge label="N/A" count={summary.na} colorKey="NA" />
            <SummaryBadge label="Neutral" count={summary.neutral} colorKey="Neutral" />
            <SummaryBadge label="No Response" count={summary.noResponse} colorKey="NoResponse" />
          </div>
        </div>

        {/* Table card */}
        <div style={{ ...cardStyle, overflowX: 'auto' }}>
          <table style={tableStyle}>
            <tbody>
              {sections.map(section => {
                const sectionItems = items.filter(i => i.sectionNumber === section.number);
                const secSummary = computeSummary(sectionItems);
                const secResponded = secSummary.total - secSummary.noResponse;
                const secPct = secSummary.total > 0 ? Math.round((secResponded / secSummary.total) * 100) : 0;

                return (
                  <React.Fragment key={section.number}>
                    {/* Section header row */}
                    <tr>
                      <td colSpan={4} style={sectionHeaderStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Section {section.number}: {section.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', opacity: 0.8 }}>
                              {secResponded}/{secSummary.total}
                            </span>
                            <span style={{ fontSize: '11px', opacity: 0.8 }}>{secPct}%</span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Item rows */}
                    {sectionItems.map(item => (
                      <tr key={item.id}>
                        {/* Item number */}
                        <td style={itemNumberStyle}>{item.itemNumber}</td>

                        {/* Description */}
                        <td style={descriptionStyle}>
                          <div style={{ fontSize: '13px', color: HBC_COLORS.gray800 }}>{item.label}</div>
                          {/* Details sub-text */}
                          {item.details && editingDetails !== item.id && (
                            <div
                              style={{
                                fontSize: '11px', color: HBC_COLORS.gray500, fontStyle: 'italic', marginTop: '2px',
                                cursor: canEdit ? 'pointer' : 'default',
                              }}
                              onClick={() => {
                                if (canEdit) { setEditingDetails(item.id); setDetailsText(item.details || ''); }
                              }}
                            >
                              {item.details}
                            </div>
                          )}
                          {!item.details && canEdit && editingDetails !== item.id && (
                            <div
                              style={{ fontSize: '11px', color: HBC_COLORS.info, cursor: 'pointer', marginTop: '2px' }}
                              onClick={() => { setEditingDetails(item.id); setDetailsText(''); }}
                            >
                              Add details
                            </div>
                          )}
                          {editingDetails === item.id && (
                            <div style={{ marginTop: '4px' }}>
                              <textarea
                                value={detailsText}
                                onChange={(e) => setDetailsText(e.target.value)}
                                onBlur={() => {
                                  onResponseChange(item.id, { details: detailsText || undefined });
                                  setEditingDetails(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    onResponseChange(item.id, { details: detailsText || undefined });
                                    setEditingDetails(null);
                                  }
                                  if (e.key === 'Escape') setEditingDetails(null);
                                }}
                                autoFocus
                                rows={2}
                                style={{
                                  width: '100%', fontSize: '11px', padding: '4px 6px', borderRadius: '4px',
                                  border: `1px solid ${HBC_COLORS.gray300}`, resize: 'vertical',
                                }}
                              />
                            </div>
                          )}
                          {item.isCustom && canEdit && onRemoveItem && (
                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.id)}
                              style={{
                                marginTop: '4px', fontSize: '10px', color: HBC_COLORS.error,
                                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </td>

                        {/* Response */}
                        <td style={responseColStyle}>
                          {renderResponse(item, canEdit, onResponseChange, resolvedItems)}
                        </td>

                        {/* Comment */}
                        <td style={commentColStyle}>
                          <input
                            type="text"
                            value={item.comment || ''}
                            disabled={!canEdit}
                            placeholder={item.placeholder || 'Comment'}
                            onChange={(e) => onCommentChange(item.id, e.target.value)}
                            style={{
                              width: '100%', padding: '4px 6px', borderRadius: '4px',
                              border: `1px solid ${HBC_COLORS.gray200}`, fontSize: '12px',
                              backgroundColor: canEdit ? HBC_COLORS.white : HBC_COLORS.gray50,
                            }}
                          />
                        </td>
                      </tr>
                    ))}

                    {/* Add item row */}
                    {canEdit && onAddItem && (
                      <tr>
                        <td colSpan={4} style={{ ...tdStyle, borderBottom: `2px solid ${HBC_COLORS.gray200}` }}>
                          <button
                            type="button"
                            onClick={() => onAddItem(section.number, {
                              sectionNumber: section.number,
                              sectionName: section.name,
                            })}
                            style={{
                              padding: '4px 12px', fontSize: '12px', color: HBC_COLORS.info,
                              background: 'none', border: `1px dashed ${HBC_COLORS.gray300}`,
                              borderRadius: '4px', cursor: 'pointer', width: '100%',
                            }}
                          >
                            + Add Item
                          </button>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
