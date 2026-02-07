import * as React from 'react';
import { Button } from '@fluentui/react-components';
import { ExportService } from '../../services/ExportService';
import { HBC_COLORS } from '../../theme/tokens';

interface IExportButtonsProps {
  /** Element ID for PDF export (captures the element as PDF) */
  pdfElementId?: string;
  /** Data rows for Excel/CSV export */
  data?: Record<string, unknown>[];
  /** Base filename without extension */
  filename: string;
  /** Optional title for exported files */
  title?: string;
}

const exportService = new ExportService();

export const ExportButtons: React.FC<IExportButtonsProps> = ({ pdfElementId, data, filename, title }) => {
  const [exporting, setExporting] = React.useState<string | null>(null);

  const handleExport = async (format: 'pdf' | 'excel' | 'csv'): Promise<void> => {
    try {
      setExporting(format);
      if (format === 'pdf' && pdfElementId) {
        await exportService.exportToPDF(pdfElementId, { filename, title });
      } else if (format === 'excel' && data) {
        await exportService.exportToExcel(data, { filename, title });
      } else if (format === 'csv' && data) {
        exportService.exportToCSV(data, { filename, title });
      }
    } catch (err) {
      console.error(`Export to ${format} failed:`, err);
    } finally {
      setExporting(null);
    }
  };

  const btnStyle: React.CSSProperties = { fontSize: '12px', minWidth: 'auto' };

  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      <span style={{ fontSize: '12px', color: HBC_COLORS.gray400, marginRight: '4px' }}>Export:</span>
      {pdfElementId && (
        <Button
          size="small"
          appearance="subtle"
          style={btnStyle}
          disabled={!!exporting}
          onClick={() => handleExport('pdf')}
        >
          {exporting === 'pdf' ? '...' : 'PDF'}
        </Button>
      )}
      {data && (
        <>
          <Button
            size="small"
            appearance="subtle"
            style={btnStyle}
            disabled={!!exporting}
            onClick={() => handleExport('excel')}
          >
            {exporting === 'excel' ? '...' : 'Excel'}
          </Button>
          <Button
            size="small"
            appearance="subtle"
            style={btnStyle}
            disabled={!!exporting}
            onClick={() => handleExport('csv')}
          >
            {exporting === 'csv' ? '...' : 'CSV'}
          </Button>
        </>
      )}
    </div>
  );
};
