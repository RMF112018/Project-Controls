import { DataProviderFactory } from '../DataProviderFactory';
import { NotImplementedError } from '../../services/NotImplementedError';
import { MockDataService } from '../../services/MockDataService';

describe('DataProviderFactory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.VITE_DATA_SERVICE_BACKEND;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getConfiguredBackend', () => {
    it('defaults to sharepoint when env var is absent', () => {
      expect(DataProviderFactory.getConfiguredBackend()).toBe('sharepoint');
    });

    it('reads azuresql from env', () => {
      process.env.VITE_DATA_SERVICE_BACKEND = 'azuresql';
      expect(DataProviderFactory.getConfiguredBackend()).toBe('azuresql');
    });

    it('reads dataverse from env', () => {
      process.env.VITE_DATA_SERVICE_BACKEND = 'dataverse';
      expect(DataProviderFactory.getConfiguredBackend()).toBe('dataverse');
    });

    it('falls back to sharepoint for unknown values', () => {
      process.env.VITE_DATA_SERVICE_BACKEND = 'postgres';
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      expect(DataProviderFactory.getConfiguredBackend()).toBe('sharepoint');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown backend')
      );
      warnSpy.mockRestore();
    });

    it('trims and lowercases env value', () => {
      process.env.VITE_DATA_SERVICE_BACKEND = '  AzureSql  ';
      expect(DataProviderFactory.getConfiguredBackend()).toBe('azuresql');
    });
  });

  describe('create', () => {
    it('returns MockDataService for sharepoint with useMockForSharePoint', () => {
      const svc = DataProviderFactory.create('sharepoint', { useMockForSharePoint: true });
      expect(svc).toBeInstanceOf(MockDataService);
    });

    it('returns MockDataService fallback for sharepoint without options', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const svc = DataProviderFactory.create('sharepoint');
      expect(svc).toBeInstanceOf(MockDataService);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('returns AzureSql stub that throws NotImplementedError', () => {
      const svc = DataProviderFactory.create('azuresql');
      expect(() => svc.getLeads()).toThrow(NotImplementedError);
      try {
        svc.getLeads();
      } catch (err) {
        expect((err as NotImplementedError).backend).toBe('AzureSql');
        expect((err as NotImplementedError).method).toBe('getLeads');
      }
    });

    it('returns Dataverse stub that throws NotImplementedError', () => {
      const svc = DataProviderFactory.create('dataverse');
      expect(() => svc.getCurrentUser()).toThrow(NotImplementedError);
      try {
        svc.getCurrentUser();
      } catch (err) {
        expect((err as NotImplementedError).backend).toBe('Dataverse');
        expect((err as NotImplementedError).method).toBe('getCurrentUser');
      }
    });

    it('uses env-configured backend when no explicit backend given', () => {
      process.env.VITE_DATA_SERVICE_BACKEND = 'azuresql';
      const svc = DataProviderFactory.create();
      expect(() => svc.getLeads()).toThrow(NotImplementedError);
    });

    it('explicit backend param overrides env', () => {
      process.env.VITE_DATA_SERVICE_BACKEND = 'azuresql';
      const svc = DataProviderFactory.create('sharepoint', { useMockForSharePoint: true });
      expect(svc).toBeInstanceOf(MockDataService);
    });
  });
});
