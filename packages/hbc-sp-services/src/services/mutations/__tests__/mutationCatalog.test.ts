import { waveAMutationCatalog } from '../mutationCatalog';
import { getWaveAMutationDescriptor, hasWaveAMutationDescriptor } from '../buildMutationPlan';
import { createDefaultMutationDescriptor } from '../defaultPlan';
import { CACHE_KEYS } from '../../../utils/constants';
import type { MutationMethodKey } from '../types';

describe('waveAMutationCatalog', () => {
  it('contains exactly 12 Wave-A mutation entries', () => {
    expect(Object.keys(waveAMutationCatalog)).toHaveLength(12);
  });

  const expectedMethods: MutationMethodKey[] = [
    'createLead', 'updateLead', 'deleteLead',
    'createEstimatingRecord', 'updateEstimatingRecord',
    'addBuyoutEntry', 'updateBuyoutEntry', 'removeBuyoutEntry',
    'updateProjectManagementPlan', 'submitPMPForApproval',
    'respondToPMPApproval', 'signPMP',
  ];

  it.each(expectedMethods)('has entry for %s', (method) => {
    const entry = waveAMutationCatalog[method];
    expect(entry).toBeDefined();
    expect(entry!.method).toBe(method);
  });

  describe('leads mutations', () => {
    it.each(['createLead', 'updateLead', 'deleteLead'] as MutationMethodKey[])(
      '%s has correct domain and invalidation',
      (method) => {
        const entry = waveAMutationCatalog[method]!;
        expect(entry.domain).toBe('leads');
        expect(entry.invalidation.projectScoped).toBe(false);
        expect(entry.invalidation.cacheTags).toContain(CACHE_KEYS.LEADS);
        expect(entry.invalidation.queryFamilies).toContain('leads');
      },
    );

    it('createLead uses append strategy', () => {
      expect(waveAMutationCatalog.createLead!.optimisticStrategy).toBe('append');
    });

    it('updateLead uses replaceById strategy', () => {
      expect(waveAMutationCatalog.updateLead!.optimisticStrategy).toBe('replaceById');
    });

    it('deleteLead uses removeById strategy', () => {
      expect(waveAMutationCatalog.deleteLead!.optimisticStrategy).toBe('removeById');
    });
  });

  describe('buyout mutations', () => {
    it.each(['addBuyoutEntry', 'updateBuyoutEntry', 'removeBuyoutEntry'] as MutationMethodKey[])(
      '%s is project-scoped',
      (method) => {
        const entry = waveAMutationCatalog[method]!;
        expect(entry.domain).toBe('buyout');
        expect(entry.invalidation.projectScoped).toBe(true);
        expect(entry.invalidation.cacheTags).toContain(CACHE_KEYS.BUYOUT);
      },
    );
  });

  describe('PMP mutations', () => {
    it.each([
      'updateProjectManagementPlan',
      'submitPMPForApproval',
      'respondToPMPApproval',
      'signPMP',
    ] as MutationMethodKey[])('%s uses merge strategy and is project-scoped', (method) => {
      const entry = waveAMutationCatalog[method]!;
      expect(entry.domain).toBe('pmp');
      expect(entry.optimisticStrategy).toBe('merge');
      expect(entry.invalidation.projectScoped).toBe(true);
      expect(entry.invalidation.cacheTags).toContain(CACHE_KEYS.PMP);
    });
  });
});

describe('createDefaultMutationDescriptor', () => {
  it('creates a fallback descriptor with no optimistic strategy', () => {
    const desc = createDefaultMutationDescriptor('getLeads' as MutationMethodKey);

    expect(desc.method).toBe('getLeads');
    expect(desc.domain).toBe('unknown');
    expect(desc.optimisticStrategy).toBe('none');
    expect(desc.invalidation.queryFamilies).toEqual([]);
    expect(desc.invalidation.cacheTags).toEqual([]);
    expect(desc.invalidation.cachePrefixes).toEqual([]);
    expect(desc.invalidation.projectScoped).toBe(false);
  });
});

describe('getWaveAMutationDescriptor', () => {
  it('returns catalog entry for known Wave-A method', () => {
    const desc = getWaveAMutationDescriptor('createLead');

    expect(desc.method).toBe('createLead');
    expect(desc.domain).toBe('leads');
    expect(desc.optimisticStrategy).toBe('append');
  });

  it('returns default descriptor for unknown method', () => {
    const desc = getWaveAMutationDescriptor('getLeads' as MutationMethodKey);

    expect(desc.method).toBe('getLeads');
    expect(desc.domain).toBe('unknown');
    expect(desc.optimisticStrategy).toBe('none');
  });
});

describe('hasWaveAMutationDescriptor', () => {
  it('returns true for known Wave-A method', () => {
    expect(hasWaveAMutationDescriptor('createLead')).toBe(true);
    expect(hasWaveAMutationDescriptor('updateBuyoutEntry')).toBe(true);
    expect(hasWaveAMutationDescriptor('signPMP')).toBe(true);
  });

  it('returns false for non-Wave-A method', () => {
    expect(hasWaveAMutationDescriptor('getLeads' as MutationMethodKey)).toBe(false);
    expect(hasWaveAMutationDescriptor('getActiveProjects' as MutationMethodKey)).toBe(false);
  });
});
