/**
 * DynamicImports — Phase 5D.1 gap tests for branch coverage.
 *
 * Each loader has a cached-path branch (if (!promise) vs. reuse).
 * Tests call each loader twice to cover both branches.
 */

// Mock all dynamic imports before any imports
jest.mock('html2canvas', () => ({ default: jest.fn() }), { virtual: true });
jest.mock('jspdf', () => ({ jsPDF: jest.fn() }), { virtual: true });
jest.mock('xlsx', () => ({ utils: {}, write: jest.fn() }), { virtual: true });
jest.mock('echarts/core', () => ({ use: jest.fn() }), { virtual: true });
jest.mock('echarts-for-react', () => ({ default: jest.fn() }), { virtual: true });

describe('DynamicImports', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('loadHtml2Canvas caches the promise on second call', async () => {
    const { loadHtml2Canvas } = await import('../DynamicImports');
    const first = loadHtml2Canvas();
    const second = loadHtml2Canvas();
    expect(first).toBe(second); // same promise reference
    await first;
  });

  it('loadJsPdf caches the promise on second call', async () => {
    const { loadJsPdf } = await import('../DynamicImports');
    const first = loadJsPdf();
    const second = loadJsPdf();
    expect(first).toBe(second);
    await first;
  });

  it('loadXlsxModule caches the promise on second call', async () => {
    const { loadXlsxModule } = await import('../DynamicImports');
    const first = loadXlsxModule();
    const second = loadXlsxModule();
    expect(first).toBe(second);
    await first;
  });

  it('loadEChartsRuntime caches both promises on second call', async () => {
    const { loadEChartsRuntime } = await import('../DynamicImports');
    const first = loadEChartsRuntime();
    const second = loadEChartsRuntime();
    // Both calls should return the same eventual result
    const r1 = await first;
    const r2 = await second;
    expect(r1.echartsCore).toBe(r2.echartsCore);
    expect(r1.ReactECharts).toBe(r2.ReactECharts);
  });
});
