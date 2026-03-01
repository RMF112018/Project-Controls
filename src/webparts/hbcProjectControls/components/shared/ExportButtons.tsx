import * as React from 'react';
import { Button } from '@fluentui/react-components';
import { ExportService } from '@hbc/sp-services';
import { useButtonStyles } from './useButtonStyles';

interface IExportButtonsProps {
  pdfElementId?: string;
  data?: Record<string, unknown>[];
  filename: string;
  title?: string;
}

const exportService = new ExportService();
type IExportServiceWithJson = ExportService & { exportToJSON?: (data: Record<string, unknown>[], options: { filename: string; title?: string }) => void };

export const ExportButtons: React.FC<IExportButtonsProps> = ({ pdfElementId, data, filename, title }) => {
  const btnStyles = useButtonStyles();
  const [exporting, setExporting] = React.useState<string | null>(null);

  const handleExport = async (format: 'pdf' | 'excel' | 'csv' | 'json'): Promise<void> => {
    try {
      setExporting(format);
      if (format === 'pdf' && pdfElementId) {
        await exportService.exportToPDF(pdfElementId, { filename, title });
      } else if (format === 'excel' && data) {
        await exportService.exportToExcel(data, { filename, title });
      } else if (format === 'csv' && data) {
        exportService.exportToCSV(data, { filename, title });
      } else if (format === 'json' && data) {
        (exportService as IExportServiceWithJson).exportToJSON?.(data, { filename, title });
      }
    } catch (err) {
      console.error(`Export to ${format} failed:`, err);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className={btnStyles.exportBar}>
      <span className={btnStyles.exportLabel}>Export:</span>
      {pdfElementId && (
        <Button size="small" appearance="subtle" className={btnStyles.compact} disabled={!!exporting} onClick={() => handleExport('pdf')}>
          {exporting === 'pdf' ? '...' : 'PDF'}
        </Button>
      )}
      {data && (
        <>
          <Button size="small" appearance="subtle" className={btnStyles.compact} disabled={!!exporting} onClick={() => handleExport('excel')}>
            {exporting === 'excel' ? '...' : 'Excel'}
          </Button>
          <Button size="small" appearance="subtle" className={btnStyles.compact} disabled={!!exporting} onClick={() => handleExport('csv')}>
            {exporting === 'csv' ? '...' : 'CSV'}
          </Button>
          <Button size="small" appearance="subtle" className={btnStyles.compact} disabled={!!exporting} onClick={() => handleExport('json')}>
            {exporting === 'json' ? '...' : 'JSON'}
          </Button>
        </>
      )}
    </div>
  );
};
