/**
 * Phase 4 (GNG Plan) — Project Header Info.
 *
 * Responsive 2-column metadata grid displaying all 24 Section 1 header
 * fields from the associated ILead record. Gives evaluators full project
 * context without leaving the scorecard detail page.
 */
import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import type { ILead, IGoNoGoScorecard } from '@hbc/sp-services';
import { SPACING } from '../../theme/tokens';

// ── Types ──────────────────────────────────────────────────────────────

export interface IProjectHeaderInfoProps {
  lead: ILead | null;
  scorecard: IGoNoGoScorecard | null;
  projectName?: string;
}

// ── Styles ─────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding(SPACING.md),
    backgroundColor: tokens.colorNeutralBackground1,
  },
  heading: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginTop: '0',
    marginBottom: SPACING.md,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap(SPACING.sm, SPACING.lg),
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  field: {
    display: 'grid',
    rowGap: tokens.spacingVerticalXXS,
  },
  label: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  value: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
  },
  empty: {
    color: tokens.colorNeutralForeground4,
  },
});

// ── Formatters ─────────────────────────────────────────────────────────

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '\u2014';
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function formatPercent(value: number | undefined | null): string {
  if (value == null) return '\u2014';
  return `${value.toFixed(1)}%`;
}

function formatDate(value: string | undefined | null): string {
  if (!value) return '\u2014';
  try {
    return new Date(value).toLocaleDateString('en-US');
  } catch {
    return value;
  }
}

function formatNumber(value: number | string | undefined | null): string {
  if (value == null) return '\u2014';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  return num.toLocaleString('en-US');
}

function formatAddress(lead: ILead): string {
  const parts = [lead.AddressStreet, lead.AddressCity, lead.AddressState, lead.AddressZip].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : '\u2014';
}

// ── Component ──────────────────────────────────────────────────────────

const FieldItem: React.FC<{ label: string; value: string }> = React.memo(({ label, value }) => {
  const styles = useStyles();
  const isEmpty = value === '\u2014';
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <span className={isEmpty ? styles.empty : styles.value}>{value}</span>
    </div>
  );
});
FieldItem.displayName = 'FieldItem';

export const ProjectHeaderInfo: React.FC<IProjectHeaderInfoProps> = React.memo(({
  lead,
  scorecard,
  projectName,
}) => {
  const styles = useStyles();

  if (!lead) return null;

  const displayName = projectName || lead.Title || '\u2014';
  const sectorDisplay = lead.SubSector
    ? `${lead.Sector ?? '\u2014'} / ${lead.SubSector}`
    : (lead.Sector ?? '\u2014');

  return (
    <div className={styles.root} aria-label="Project information">
      <h3 className={styles.heading}>Project Information</h3>
      <div className={styles.grid}>
        <FieldItem label="Project Name" value={displayName} />
        <FieldItem label="Client" value={lead.ClientName ?? '\u2014'} />
        <FieldItem label="AE" value={lead.AE ?? '\u2014'} />
        <FieldItem label="Region" value={lead.Region ?? '\u2014'} />
        <FieldItem label="Sector / Sub-Sector" value={sectorDisplay} />
        <FieldItem label="Division" value={lead.Division ?? '\u2014'} />
        <FieldItem label="Originator" value={lead.Originator ?? '\u2014'} />
        <FieldItem label="Dept of Origin" value={lead.DepartmentOfOrigin ?? '\u2014'} />
        <FieldItem label="Date of Evaluation" value={formatDate(lead.DateOfEvaluation)} />
        <FieldItem label="Date Submitted" value={formatDate(lead.DateSubmitted)} />
        <FieldItem label="City / Location" value={lead.CityLocation ?? '\u2014'} />
        <FieldItem label="Address" value={formatAddress(lead)} />
        <FieldItem label="Delivery Method" value={lead.DeliveryMethod ?? '\u2014'} />
        <FieldItem label="Square Feet" value={formatNumber(lead.SquareFeet)} />
        <FieldItem label="Project Value" value={formatCurrency(lead.ProjectValue)} />
        <FieldItem label="Anticipated Fee %" value={formatPercent(lead.AnticipatedFeePct)} />
        <FieldItem label="Project Start Date" value={formatDate(lead.ProjectStartDate)} />
        <FieldItem label="Duration (Months)" value={lead.ProjectDurationMonths ?? '\u2014'} />
        <FieldItem label="Precon Duration (Months)" value={formatNumber(lead.PreconDurationMonths)} />
        <FieldItem label="Est. Pursuit Cost" value={formatCurrency(lead.EstimatedPursuitCost)} />
        <FieldItem label="Est. Precon Budget" value={formatCurrency(lead.EstimatedPreconBudget)} />
        <FieldItem label="Anticipated Gross Margin" value={formatCurrency(lead.AnticipatedGrossMargin)} />
        <FieldItem label="Proposal / Bid Due" value={formatDate(lead.ProposalBidDue)} />
        <FieldItem label="Award Date" value={formatDate(lead.AwardDate)} />
      </div>
    </div>
  );
});
ProjectHeaderInfo.displayName = 'ProjectHeaderInfo';
