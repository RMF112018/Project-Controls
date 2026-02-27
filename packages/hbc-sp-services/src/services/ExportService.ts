import { loadPdfDeps, loadXlsx } from '../utils/LazyExportUtils';
import type { IMonitoringExportPayload } from './ITelemetryService';

export interface IExportOptions {
  filename: string;
  title?: string;
  subtitle?: string;
}

export class ExportService {
  private saveBlob(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async exportToPDF(elementId: string, options: IExportOptions): Promise<void> {
    try {
      const { html2canvas, jsPDF } = await loadPdfDeps();

      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with id "${elementId}" not found`);
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      const headerHeight = 40;
      const footerHeight = 30;
      const totalHeight = canvas.height + headerHeight + footerHeight;

      const pdfDoc = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, totalHeight],
      });

      // Branded header
      pdfDoc.setFillColor(27, 42, 74); // HBC Navy
      pdfDoc.rect(0, 0, canvas.width, headerHeight, 'F');
      pdfDoc.setTextColor(232, 119, 34); // HBC Orange
      pdfDoc.setFontSize(14);
      pdfDoc.text('HBC Project Controls', 16, 26);
      if (options.title) {
        pdfDoc.setTextColor(255, 255, 255);
        pdfDoc.setFontSize(10);
        pdfDoc.text(options.title, canvas.width - 16, 26, { align: 'right' });
      }

      // Content
      pdfDoc.addImage(imgData, 'PNG', 0, headerHeight, canvas.width, canvas.height);

      // Footer
      pdfDoc.setFillColor(249, 250, 251); // Gray50
      pdfDoc.rect(0, headerHeight + canvas.height, canvas.width, footerHeight, 'F');
      pdfDoc.setTextColor(107, 114, 128); // Gray500
      pdfDoc.setFontSize(8);
      pdfDoc.text(
        `Generated ${new Date().toLocaleString('en-US')}`,
        16,
        headerHeight + canvas.height + 18
      );

      pdfDoc.save(`${options.filename}.pdf`);
    } catch (error) {
      console.error('[ExportService] PDF export failed:', error);
      throw error;
    }
  }

  async exportToExcel(
    data: Record<string, unknown>[],
    options: IExportOptions & { sheetName?: string }
  ): Promise<void> {
    try {
      const XLSX = await loadXlsx();
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Sheet1');
      XLSX.writeFile(workbook, `${options.filename}.xlsx`);
    } catch (error) {
      console.error('[ExportService] Excel export failed:', error);
      throw error;
    }
  }

  async exportToExcelMultiSheet(
    sheets: Array<{ name: string; data: Record<string, unknown>[] }>,
    options: IExportOptions
  ): Promise<void> {
    try {
      const XLSX = await loadXlsx();
      const workbook = XLSX.utils.book_new();
      for (const sheet of sheets) {
        const worksheet = XLSX.utils.json_to_sheet(sheet.data);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
      }
      XLSX.writeFile(workbook, `${options.filename}.xlsx`);
    } catch (error) {
      console.error('[ExportService] Multi-sheet Excel export failed:', error);
      throw error;
    }
  }

  exportToCSV(data: Record<string, unknown>[], options: IExportOptions): void {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(h => {
          const val = row[h];
          const str = val === null || val === undefined ? '' : String(val);
          // Escape quotes and wrap in quotes if contains comma/quote/newline
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    this.saveBlob(blob, `${options.filename}.csv`);
  }

  exportToJSON(data: Record<string, unknown>[], options: IExportOptions): void {
    const payload = JSON.stringify(data, null, 2);
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8;' });
    this.saveBlob(blob, `${options.filename}.json`);
  }

  exportMonitoringBundle(payload: IMonitoringExportPayload, options: IExportOptions): void {
    const filenameBase = options.filename;
    const metadata = payload.metadata;
    const rows = payload.rows;
    const aggregates = payload.aggregates;

    const jsonBlob = new Blob([
      JSON.stringify({
        metadata,
        rows,
        aggregates,
      }, null, 2),
    ], { type: 'application/json;charset=utf-8;' });
    this.saveBlob(jsonBlob, `${filenameBase}.monitoring.json`);

    const rowCsvData = rows.map((row) => ({
      timestamp: row.timestamp,
      kind: row.kind,
      name: row.name,
      route: row.route,
      workspace: row.workspace,
      role: row.role,
      corr_session_id: row.corr_session_id,
      corr_operation_id: row.corr_operation_id,
      corr_parent_operation_id: row.corr_parent_operation_id ?? '',
      properties: row.propertiesJson,
      measurements: row.measurementsJson,
    }));
    this.exportToCSV(rowCsvData, { filename: `${filenameBase}.monitoring.rows`, title: options.title });

    const aggregateCsvData: Record<string, unknown>[] = [
      ...aggregates.byDay.map((row) => ({ category: 'byDay', key: row.day, value: row.count })),
      ...aggregates.byName.map((row) => ({ category: 'byName', key: row.name, value: row.count })),
      ...aggregates.p95ByMetric.map((row) => ({ category: 'p95ByMetric', key: row.metric, value: row.p95 })),
      ...aggregates.breachCounts.map((row) => ({
        category: 'breachCounts',
        key: row.metric,
        value: row.count,
        threshold: row.threshold,
      })),
    ];
    this.exportToCSV(aggregateCsvData, { filename: `${filenameBase}.monitoring.aggregates`, title: options.title });
  }
}

export const exportService = new ExportService();
