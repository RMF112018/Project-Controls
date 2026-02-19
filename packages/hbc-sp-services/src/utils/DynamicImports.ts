export type Html2CanvasFn = typeof import('html2canvas').default;
export type JsPdfCtor = typeof import('jspdf').jsPDF;
export type XlsxModule = typeof import('xlsx');

export type EChartsCoreModule = typeof import('echarts/core');
export type EChartsReactComponent = typeof import('echarts-for-react').default;

let html2CanvasPromise: Promise<Html2CanvasFn> | null = null;
let jsPdfPromise: Promise<JsPdfCtor> | null = null;
let xlsxPromise: Promise<XlsxModule> | null = null;
let echartsCorePromise: Promise<EChartsCoreModule> | null = null;
let echartsReactPromise: Promise<EChartsReactComponent> | null = null;

export function loadHtml2Canvas(): Promise<Html2CanvasFn> {
  if (!html2CanvasPromise) {
    html2CanvasPromise = import(
      /* webpackChunkName: "lib-export-canvas" */ 'html2canvas'
    ).then((mod) => mod.default);
  }
  return html2CanvasPromise;
}

export function loadJsPdf(): Promise<JsPdfCtor> {
  if (!jsPdfPromise) {
    jsPdfPromise = import(
      /* webpackChunkName: "lib-export-pdf" */ 'jspdf'
    ).then((mod) => mod.jsPDF);
  }
  return jsPdfPromise;
}

export function loadXlsxModule(): Promise<XlsxModule> {
  if (!xlsxPromise) {
    xlsxPromise = import(
      /* webpackChunkName: "lib-export-excel" */ 'xlsx'
    );
  }
  return xlsxPromise;
}

export async function loadEChartsRuntime(): Promise<{
  echartsCore: EChartsCoreModule;
  ReactECharts: EChartsReactComponent;
}> {
  if (!echartsCorePromise) {
    echartsCorePromise = import(
      /* webpackChunkName: "lib-echarts-runtime" */ 'echarts/core'
    );
  }

  if (!echartsReactPromise) {
    echartsReactPromise = import(
      /* webpackChunkName: "lib-echarts-runtime" */ 'echarts-for-react'
    ).then((mod) => mod.default);
  }

  const [echartsCore, ReactECharts] = await Promise.all([
    echartsCorePromise,
    echartsReactPromise,
  ]);

  return {
    echartsCore,
    ReactECharts,
  };
}
