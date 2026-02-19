import {
  loadHtml2Canvas,
  loadJsPdf,
  loadXlsxModule,
  type Html2CanvasFn,
  type JsPdfCtor,
  type XlsxModule,
} from './DynamicImports';

let pdfDepsPromise: Promise<{ html2canvas: Html2CanvasFn; jsPDF: JsPdfCtor }> | null = null;

export function loadPdfDeps(): Promise<{ html2canvas: Html2CanvasFn; jsPDF: JsPdfCtor }> {
  if (!pdfDepsPromise) {
    pdfDepsPromise = Promise.all([loadHtml2Canvas(), loadJsPdf()]).then(([html2canvas, jsPDF]) => ({
      html2canvas,
      jsPDF,
    }));
  }

  return pdfDepsPromise;
}

export function loadXlsx(): Promise<XlsxModule> {
  return loadXlsxModule();
}
