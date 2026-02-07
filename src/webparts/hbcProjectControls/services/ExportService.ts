export interface IExportOptions {
  filename: string;
  title?: string;
  subtitle?: string;
}

export class ExportService {
  async exportToPDF(elementId: string, options: IExportOptions): Promise<void> {
    try {
      // Dynamic imports for code splitting
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

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
      const XLSX = await import('xlsx');
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
      const XLSX = await import('xlsx');
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
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${options.filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

export const exportService = new ExportService();
