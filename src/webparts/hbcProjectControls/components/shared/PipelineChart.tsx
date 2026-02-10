import * as React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ILead, Stage } from '../../models';
import { HBC_COLORS, ELEVATION } from '../../theme/tokens';
import { STAGE_COLORS, STAGE_ORDER } from '../../utils/constants';
import { getStageLabel, isArchived } from '../../utils/stageEngine';
import { formatCurrencyCompact } from '../../utils/formatters';

interface IPipelineChartProps {
  leads: ILead[];
  mode?: 'count' | 'value';
  height?: number;
}

interface IStageData {
  stage: Stage;
  label: string;
  count: number;
  value: number;
  color: string;
}

export const PipelineChart: React.FC<IPipelineChartProps> = ({ leads, mode = 'count', height = 320 }) => {
  const data: IStageData[] = React.useMemo(() => {
    const groups: Record<string, ILead[]> = {};
    for (const lead of leads) {
      if (!isArchived(lead.Stage)) {
        if (!groups[lead.Stage]) groups[lead.Stage] = [];
        groups[lead.Stage].push(lead);
      }
    }

    return STAGE_ORDER
      .filter(s => !isArchived(s as Stage))
      .map(stage => ({
        stage: stage as Stage,
        label: getStageLabel(stage as Stage),
        count: (groups[stage] || []).length,
        value: (groups[stage] || []).reduce((sum, l) => sum + (l.ProjectValue || 0), 0),
        color: STAGE_COLORS[stage] || HBC_COLORS.gray400,
      }));
  }, [leads]);

  const dataKey = mode === 'count' ? 'count' : 'value';

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '24px',
      boxShadow: ELEVATION.level1,
    }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: HBC_COLORS.gray500 }}
            angle={-25}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fontSize: 11, fill: HBC_COLORS.gray500 }}
            allowDecimals={false}
            tickFormatter={mode === 'value' ? (v: number) => formatCurrencyCompact(v) : undefined}
          />
          <Tooltip
            formatter={(v: number) => [
              mode === 'value' ? formatCurrencyCompact(v) : v,
              mode === 'value' ? 'Pipeline Value' : 'Lead Count',
            ]}
            contentStyle={{
              borderRadius: '6px',
              border: `1px solid ${HBC_COLORS.gray200}`,
              fontSize: '13px',
            }}
          />
          <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
            {data.map(entry => (
              <Cell key={entry.stage} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
