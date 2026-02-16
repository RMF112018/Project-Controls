import { MockDataService } from '../MockDataService';

describe('MockDataService — Risk & Cost Management', () => {
  let ds: MockDataService;

  beforeEach(() => {
    ds = new MockDataService();
  });

  // ─── getRiskCostManagement ─────────────────────────────────────────

  describe('getRiskCostManagement', () => {
    it('returns assembled record for 25-042-01 with categorized items', async () => {
      const record = await ds.getRiskCostManagement('25-042-01');
      expect(record).not.toBeNull();
      expect(record!.projectCode).toBe('25-042-01');
      expect(record!.contractType).toBe('GMP');
      expect(record!.contractAmount).toBe(48500000);
      expect(record!.buyoutOpportunities).toHaveLength(3);
      expect(record!.potentialRisks).toHaveLength(4);
      expect(record!.potentialSavings).toHaveLength(3);
    });

    it('returns null for unknown project code', async () => {
      const record = await ds.getRiskCostManagement('BOGUS');
      expect(record).toBeNull();
    });

    it('items have correct category assignments', async () => {
      const record = await ds.getRiskCostManagement('25-042-01');
      expect(record!.buyoutOpportunities.every(i => i.category === 'Buyout')).toBe(true);
      expect(record!.potentialRisks.every(i => i.category === 'Risk')).toBe(true);
      expect(record!.potentialSavings.every(i => i.category === 'Savings')).toBe(true);
    });
  });

  // ─── updateRiskCostManagement ──────────────────────────────────────

  describe('updateRiskCostManagement', () => {
    it('updates fields and sets lastUpdatedAt', async () => {
      const before = new Date().toISOString();
      const result = await ds.updateRiskCostManagement('25-042-01', {
        contractType: 'Lump Sum',
      });
      expect(result.contractType).toBe('Lump Sum');
      expect(result.lastUpdatedAt >= before).toBe(true);
    });

    it('returns assembled record with items', async () => {
      const result = await ds.updateRiskCostManagement('25-042-01', {});
      expect(result.buyoutOpportunities.length).toBeGreaterThan(0);
      expect(result.potentialRisks.length).toBeGreaterThan(0);
      expect(result.potentialSavings.length).toBeGreaterThan(0);
    });

    it('throws for non-existent project', async () => {
      await expect(
        ds.updateRiskCostManagement('BOGUS', {})
      ).rejects.toThrow();
    });
  });

  // ─── addRiskCostItem ───────────────────────────────────────────────

  describe('addRiskCostItem', () => {
    it('creates item with auto-generated id', async () => {
      const item = await ds.addRiskCostItem('25-042-01', {
        category: 'Risk',
        letter: 'E',
        description: 'Test risk item',
        estimatedValue: 75000,
      });
      expect(item.id).toBeGreaterThan(0);
      expect(item.category).toBe('Risk');
      expect(item.description).toBe('Test risk item');
      expect(item.estimatedValue).toBe(75000);
    });

    it('item appears in parent record on subsequent read', async () => {
      await ds.addRiskCostItem('25-042-01', {
        category: 'Savings',
        letter: 'D',
        description: 'New savings opportunity',
        estimatedValue: 50000,
      });
      const record = await ds.getRiskCostManagement('25-042-01');
      expect(record!.potentialSavings).toHaveLength(4); // was 3
      const found = record!.potentialSavings.find(i => i.description === 'New savings opportunity');
      expect(found).toBeDefined();
    });

    it('sets default values for omitted fields', async () => {
      const item = await ds.addRiskCostItem('25-042-01', {});
      expect(item.category).toBe('Risk');
      expect(item.letter).toBe('A');
      expect(item.status).toBe('Open');
      expect(item.estimatedValue).toBe(0);
      expect(item.notes).toBe('');
    });

    it('throws for non-existent project', async () => {
      await expect(
        ds.addRiskCostItem('BOGUS', { description: 'test' })
      ).rejects.toThrow();
    });
  });

  // ─── updateRiskCostItem ────────────────────────────────────────────

  describe('updateRiskCostItem', () => {
    it('updates item fields and sets updatedDate', async () => {
      const result = await ds.updateRiskCostItem('25-042-01', 201, {
        status: 'Mitigated',
        notes: 'Risk resolved via alternate approach',
      });
      expect(result.status).toBe('Mitigated');
      expect(result.notes).toBe('Risk resolved via alternate approach');
      expect(result.updatedDate).toBeDefined();
    });

    it('throws for non-existent project', async () => {
      await expect(
        ds.updateRiskCostItem('BOGUS', 201, { status: 'Closed' })
      ).rejects.toThrow();
    });

    it('throws for non-existent item id', async () => {
      await expect(
        ds.updateRiskCostItem('25-042-01', 99999, { status: 'Closed' })
      ).rejects.toThrow();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Quality Concerns
// ═══════════════════════════════════════════════════════════════════════

describe('MockDataService — Quality Concerns', () => {
  let ds: MockDataService;

  beforeEach(() => {
    ds = new MockDataService();
  });

  describe('getQualityConcerns', () => {
    it('returns 5 concerns for 25-042-01', async () => {
      const concerns = await ds.getQualityConcerns('25-042-01');
      expect(concerns).toHaveLength(5);
      expect(concerns.every(c => c.projectCode === '25-042-01')).toBe(true);
    });

    it('returns 3 concerns for 25-115-01', async () => {
      const concerns = await ds.getQualityConcerns('25-115-01');
      expect(concerns).toHaveLength(3);
    });

    it('returns empty for unknown project', async () => {
      const concerns = await ds.getQualityConcerns('BOGUS');
      expect(concerns).toEqual([]);
    });
  });

  describe('addQualityConcern', () => {
    it('creates concern with auto-id and default status Open', async () => {
      const concern = await ds.addQualityConcern('25-042-01', {
        letter: 'F',
        description: 'Test quality issue',
        raisedBy: 'test@hbc.com',
      });
      expect(concern.id).toBeGreaterThan(0);
      expect(concern.status).toBe('Open');
      expect(concern.resolvedDate).toBeNull();
      expect(concern.projectCode).toBe('25-042-01');
    });

    it('persists on subsequent read', async () => {
      await ds.addQualityConcern('25-042-01', {
        description: 'Persisted concern',
      });
      const concerns = await ds.getQualityConcerns('25-042-01');
      expect(concerns).toHaveLength(6); // was 5
    });

    it('sets default values for all omitted fields', async () => {
      const concern = await ds.addQualityConcern('25-042-01', {});
      expect(concern.letter).toBe('A');
      expect(concern.description).toBe('');
      expect(concern.raisedBy).toBe('');
      expect(concern.resolution).toBe('');
      expect(concern.notes).toBe('');
    });
  });

  describe('updateQualityConcern', () => {
    it('updates fields and returns updated concern', async () => {
      const result = await ds.updateQualityConcern('25-042-01', 1, {
        status: 'Resolved',
        resolution: 'Fixed by rework',
        resolvedDate: '2026-02-01',
      });
      expect(result.status).toBe('Resolved');
      expect(result.resolution).toBe('Fixed by rework');
      expect(result.resolvedDate).toBe('2026-02-01');
    });

    it('throws for non-existent concern', async () => {
      await expect(
        ds.updateQualityConcern('25-042-01', 99999, { status: 'Closed' })
      ).rejects.toThrow();
    });

    it('update persists on subsequent read', async () => {
      await ds.updateQualityConcern('25-042-01', 3, { status: 'Resolved' });
      const concerns = await ds.getQualityConcerns('25-042-01');
      const updated = concerns.find(c => c.id === 3);
      expect(updated!.status).toBe('Resolved');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Safety Concerns
// ═══════════════════════════════════════════════════════════════════════

describe('MockDataService — Safety Concerns', () => {
  let ds: MockDataService;

  beforeEach(() => {
    ds = new MockDataService();
  });

  describe('getSafetyConcerns', () => {
    it('returns 4 concerns for 25-042-01', async () => {
      const concerns = await ds.getSafetyConcerns('25-042-01');
      expect(concerns).toHaveLength(4);
      expect(concerns.every(c => c.projectCode === '25-042-01')).toBe(true);
    });

    it('returns 3 concerns for 25-115-01', async () => {
      const concerns = await ds.getSafetyConcerns('25-115-01');
      expect(concerns).toHaveLength(3);
    });

    it('returns empty for unknown project', async () => {
      const concerns = await ds.getSafetyConcerns('BOGUS');
      expect(concerns).toEqual([]);
    });
  });

  describe('addSafetyConcern', () => {
    it('creates concern with default severity Medium', async () => {
      const concern = await ds.addSafetyConcern('25-042-01', {
        letter: 'E',
        description: 'Test safety issue',
        raisedBy: 'test@hbc.com',
      });
      expect(concern.id).toBeGreaterThan(0);
      expect(concern.severity).toBe('Medium');
      expect(concern.status).toBe('Open');
      expect(concern.resolvedDate).toBeNull();
    });

    it('includes safety officer fields', async () => {
      const concern = await ds.addSafetyConcern('25-042-01', {
        safetyOfficerName: 'Test Officer',
        safetyOfficerEmail: 'officer@hbc.com',
      });
      expect(concern.safetyOfficerName).toBe('Test Officer');
      expect(concern.safetyOfficerEmail).toBe('officer@hbc.com');
    });

    it('persists on subsequent read', async () => {
      await ds.addSafetyConcern('25-042-01', { description: 'New issue' });
      const concerns = await ds.getSafetyConcerns('25-042-01');
      expect(concerns).toHaveLength(5); // was 4
    });
  });

  describe('updateSafetyConcern', () => {
    it('updates fields and returns updated concern', async () => {
      const result = await ds.updateSafetyConcern('25-042-01', 3, {
        status: 'Resolved',
        resolution: 'MOT plan approved and implemented',
        resolvedDate: '2026-02-01',
      });
      expect(result.status).toBe('Resolved');
      expect(result.resolution).toBe('MOT plan approved and implemented');
    });

    it('throws for non-existent concern', async () => {
      await expect(
        ds.updateSafetyConcern('25-042-01', 99999, { status: 'Closed' })
      ).rejects.toThrow();
    });

    it('update persists on subsequent read', async () => {
      await ds.updateSafetyConcern('25-115-01', 6, { status: 'Resolved' });
      const concerns = await ds.getSafetyConcerns('25-115-01');
      const updated = concerns.find(c => c.id === 6);
      expect(updated!.status).toBe('Resolved');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Project Schedule & Critical Path
// ═══════════════════════════════════════════════════════════════════════

describe('MockDataService — Schedule & Critical Path', () => {
  let ds: MockDataService;

  beforeEach(() => {
    ds = new MockDataService();
  });

  describe('getProjectSchedule', () => {
    it('returns schedule for 25-042-01 with 5 critical path items', async () => {
      const schedule = await ds.getProjectSchedule('25-042-01');
      expect(schedule).not.toBeNull();
      expect(schedule!.projectCode).toBe('25-042-01');
      expect(schedule!.criticalPathConcerns).toHaveLength(5);
      expect(schedule!.contractCalendarDays).toBe(562);
      expect(schedule!.hasLiquidatedDamages).toBe(true);
      expect(schedule!.liquidatedDamagesAmount).toBe(5000);
    });

    it('returns null for unknown project', async () => {
      const schedule = await ds.getProjectSchedule('BOGUS');
      expect(schedule).toBeNull();
    });

    it('critical path items have correct status distribution', async () => {
      const schedule = await ds.getProjectSchedule('25-042-01');
      const items = schedule!.criticalPathConcerns;
      const active = items.filter(i => i.status === 'Active');
      const monitoring = items.filter(i => i.status === 'Monitoring');
      const resolved = items.filter(i => i.status === 'Resolved');
      expect(active).toHaveLength(3); // 101, 102, 104
      expect(monitoring).toHaveLength(1); // 103
      expect(resolved).toHaveLength(1); // 105
    });
  });

  describe('updateProjectSchedule', () => {
    it('updates schedule fields and sets lastUpdatedAt', async () => {
      const before = new Date().toISOString();
      const result = await ds.updateProjectSchedule('25-042-01', {
        teamGoalDaysAhead: 45,
      });
      expect(result.teamGoalDaysAhead).toBe(45);
      expect(result.lastUpdatedAt >= before).toBe(true);
    });

    it('throws for non-existent project', async () => {
      await expect(
        ds.updateProjectSchedule('BOGUS', {})
      ).rejects.toThrow();
    });

    it('returned record includes critical path items', async () => {
      const result = await ds.updateProjectSchedule('25-042-01', {});
      expect(result.criticalPathConcerns).toHaveLength(5);
    });
  });

  describe('addCriticalPathItem', () => {
    it('creates item with auto-id and defaults', async () => {
      const item = await ds.addCriticalPathItem('25-042-01', {
        letter: 'F',
        description: 'New critical concern',
        impactDescription: 'May delay Phase 3',
      });
      expect(item.id).toBeGreaterThan(0);
      expect(item.status).toBe('Active');
      expect(item.description).toBe('New critical concern');
      expect(item.projectCode).toBe('25-042-01');
    });

    it('item appears in schedule on subsequent read', async () => {
      await ds.addCriticalPathItem('25-042-01', {
        description: 'Added item',
      });
      const schedule = await ds.getProjectSchedule('25-042-01');
      expect(schedule!.criticalPathConcerns).toHaveLength(6); // was 5
    });

    it('throws for non-existent project', async () => {
      await expect(
        ds.addCriticalPathItem('BOGUS', { description: 'test' })
      ).rejects.toThrow();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Lessons Learned
// ═══════════════════════════════════════════════════════════════════════

describe('MockDataService — Lessons Learned', () => {
  let ds: MockDataService;

  beforeEach(() => {
    ds = new MockDataService();
  });

  describe('getLessonsLearned', () => {
    it('returns 6 lessons for 25-042-01', async () => {
      const lessons = await ds.getLessonsLearned('25-042-01');
      expect(lessons).toHaveLength(6);
      expect(lessons.every(l => l.projectCode === '25-042-01')).toBe(true);
    });

    it('returns 3 lessons for 25-115-01', async () => {
      const lessons = await ds.getLessonsLearned('25-115-01');
      expect(lessons).toHaveLength(3);
    });

    it('returns 3 lessons for 24-089-01', async () => {
      const lessons = await ds.getLessonsLearned('24-089-01');
      expect(lessons).toHaveLength(3);
    });

    it('returns empty for unknown project', async () => {
      const lessons = await ds.getLessonsLearned('BOGUS');
      expect(lessons).toEqual([]);
    });
  });

  describe('addLessonLearned', () => {
    it('creates lesson with auto-id and defaults', async () => {
      const lesson = await ds.addLessonLearned('25-042-01', {
        title: 'Test lesson',
        description: 'A test lesson learned',
        recommendation: 'Do this next time',
      });
      expect(lesson.id).toBeGreaterThan(0);
      expect(lesson.projectCode).toBe('25-042-01');
      expect(lesson.title).toBe('Test lesson');
    });

    it('sets default values for omitted fields', async () => {
      const lesson = await ds.addLessonLearned('25-042-01', {});
      expect(lesson.category).toBe('Other');
      expect(lesson.impact).toBe('Neutral');
      expect(lesson.phase).toBe('Construction');
      expect(lesson.isIncludedInFinalRecord).toBe(false);
      expect(lesson.tags).toEqual([]);
    });

    it('persists on subsequent read', async () => {
      await ds.addLessonLearned('25-042-01', { title: 'Persisted' });
      const lessons = await ds.getLessonsLearned('25-042-01');
      expect(lessons).toHaveLength(7); // was 6
      expect(lessons.find(l => l.title === 'Persisted')).toBeDefined();
    });
  });

  describe('updateLessonLearned', () => {
    it('updates fields and returns updated lesson', async () => {
      const result = await ds.updateLessonLearned('25-042-01', 3, {
        isIncludedInFinalRecord: true,
      });
      expect(result.isIncludedInFinalRecord).toBe(true);
      expect(result.title).toBe('Permit re-review caused 3-week delay');
    });

    it('throws for non-existent lesson', async () => {
      await expect(
        ds.updateLessonLearned('25-042-01', 99999, { title: 'nope' })
      ).rejects.toThrow();
    });

    it('update persists on subsequent read', async () => {
      await ds.updateLessonLearned('25-042-01', 1, { category: 'Cost' });
      const lessons = await ds.getLessonsLearned('25-042-01');
      const updated = lessons.find(l => l.id === 1);
      expect(updated!.category).toBe('Cost');
    });
  });
});
