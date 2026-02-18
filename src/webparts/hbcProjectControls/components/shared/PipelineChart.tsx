import * as React from 'react';
import type { EChartsOption } from 'echarts';
import {
  ILead,
  Stage,
  STAGE_COLORS,
  STAGE_ORDER,
  getStageLabel,
  isArchived,
  formatCurrencyCompact
} from '@hbc/sp-services';
import { HBC_COLORS, ELEVATION } from '../../theme/tokens';
import { HbcEChart } from './HbcEChart';

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

  const option = React.useMemo<EChartsOption>(() => {
    const labels = data.map(d => d.label);
    const values = data.map(d => mode === 'count' ? d.count : d.value);
    const colors = data.map(d => d.color);
    const seriesName = mode === 'value' ? 'Pipeline Value' : 'Lead Count';

    return {
      grid: { top: 10, right: 16, bottom: 60, left: 16, containLabel: true },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const p = (params as Array<{ name: string; value: number; marker: string }>)[0];
          const formatted = mode === 'value' ? formatCurrencyCompact(p.value) : String(p.value);
          return `<div style="font-family:'Segoe UI',sans-serif;padding:4px 0">
            <div style="font-size:11px;color:${HBC_COLORS.gray500};margin-bottom:4px">${p.name}</div>
            <div style="font-size:13px;font-weight:600;color:${HBC_COLORS.navy}">${p.marker}${seriesName}: ${formatted}</div>
          </div>`;
        },
        extraCssText: `border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);padding:10px 14px;border:1px solid ${HBC_COLORS.gray200};`,
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          rotate: -25,
          fontSize: 11,
          color: HBC_COLORS.gray500,
          interval: 0,
        },
        axisLine: { lineStyle: { color: HBC_COLORS.gray200 } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 11,
          color: HBC_COLORS.gray500,
          formatter: (v: number) => mode === 'value' ? formatCurrencyCompact(v) : String(v),
        },
        splitLine: { lineStyle: { color: HBC_COLORS.gray100, type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar',
          name: seriesName,
          data: values.map((v, i) => ({
            value: v,
            itemStyle: {
              color: colors[i],
              borderRadius: [4, 4, 0, 0],
            },
          })),
          barMaxWidth: 60,
        },
      ],
    };
  }, [data, mode]);

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '24px',
      boxShadow: ELEVATION.level1,
    }}>
      <HbcEChart
        option={option}
        height={height}
        empty={data.length === 0}
        emptyMessage="No active pipeline data"
        ariaLabel="Pipeline by stage chart"
      />
    </div>
  );
};
