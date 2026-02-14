import * as React from 'react';
import { Button, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { ExportService } from '@hbc/sp-services';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    ...shorthands.gap('4px'),
    alignItems: 'center',
  },
  label: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground4,
    marginRight: '4px',
  },
  btn: {
    fontSize: '12px',
    minWidth: 'auto',
  },
});

interface IExportButtonsProps {
  pdfElementId?: string;
  data?: Record<string, unknown>[];
  filename: string;
  title?: string;
}

const exportService = new ExportService();

export const ExportButtons: React.FC<IExportButtonsProps> = ({ pdfElementId, data, filename, title }) => {
  const styles = useStyles();
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

  return (
    <div className={styles.container}>
      <span className={styles.label}>Export:</span>
      {pdfElementId && (
        <Button size="small" appearance="subtle" className={styles.btn} disabled={!!exporting} onClick={() => handleExport('pdf')}>
          {exporting === 'pdf' ? '...' : 'PDF'}
        </Button>
      )}
      {data && (
        <>
          <Button size="small" appearance="subtle" className={styles.btn} disabled={!!exporting} onClick={() => handleExport('excel')}>
            {exporting === 'excel' ? '...' : 'Excel'}
          </Button>
          <Button size="small" appearance="subtle" className={styles.btn} disabled={!!exporting} onClick={() => handleExport('csv')}>
            {exporting === 'csv' ? '...' : 'CSV'}
          </Button>
        </>
      )}
    </div>
  );
};
