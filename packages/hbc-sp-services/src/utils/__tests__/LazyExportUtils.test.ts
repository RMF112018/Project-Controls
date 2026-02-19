describe('LazyExportUtils', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('memoizes PDF dependency loading', async () => {
    jest.doMock('html2canvas', () => ({
      __esModule: true,
      default: jest.fn(),
    }));

    jest.doMock('jspdf', () => ({
      jsPDF: jest.fn(),
    }));

    const { loadPdfDeps } = await import('../LazyExportUtils');

    const firstCall = loadPdfDeps();
    const secondCall = loadPdfDeps();

    expect(firstCall).toBe(secondCall);

    const deps = await firstCall;
    expect(typeof deps.html2canvas).toBe('function');
    expect(typeof deps.jsPDF).toBe('function');
  });

  it('memoizes XLSX module loading', async () => {
    jest.doMock('xlsx', () => ({
      utils: {
        json_to_sheet: jest.fn(),
      },
    }));

    const { loadXlsx } = await import('../LazyExportUtils');

    const firstCall = loadXlsx();
    const secondCall = loadXlsx();

    expect(firstCall).toBe(secondCall);

    const xlsx = await firstCall;
    expect(xlsx).toBeDefined();
    expect(xlsx.utils).toBeDefined();
  });
});
