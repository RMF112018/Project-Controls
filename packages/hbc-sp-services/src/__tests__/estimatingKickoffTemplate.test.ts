import { createEstimatingKickoffTemplate } from '../utils/estimatingKickoffTemplate';
import type { EstimatingKickoffSection } from '../models/IEstimatingKickoff';

describe('createEstimatingKickoffTemplate', () => {
  const items = createEstimatingKickoffTemplate();

  it('generates the correct total count of template items', () => {
    // 14 project_info + 26 managing + 6 key_dates + 16 deliverables_standard + 9 deliverables_nonstandard = 71
    expect(items.length).toBe(71);
  });

  it('distributes items across all 5 sections', () => {
    const sections = new Set(items.map(i => i.section));
    expect(sections.size).toBe(5);
    expect(sections).toContain('project_info');
    expect(sections).toContain('managing');
    expect(sections).toContain('key_dates');
    expect(sections).toContain('deliverables_standard');
    expect(sections).toContain('deliverables_nonstandard');
  });

  it('has correct count per section', () => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.section] = (counts[item.section] || 0) + 1;
    }
    expect(counts['project_info']).toBe(14);
    expect(counts['managing']).toBe(26);
    expect(counts['key_dates']).toBe(6);
    expect(counts['deliverables_standard']).toBe(16);
    expect(counts['deliverables_nonstandard']).toBe(9);
  });

  it('contains all updated project_info rows with correct labels', () => {
    const projectInfoTasks = items.filter(i => i.section === 'project_info').map(i => i.task);
    expect(projectInfoTasks).toContain('Job Name');
    expect(projectInfoTasks).toContain('Job Number');
    expect(projectInfoTasks).toContain('Architect');
    expect(projectInfoTasks).toContain('Proposal Due Date & Time');
    expect(projectInfoTasks).toContain('Proposal to be Delivered Via');
    expect(projectInfoTasks).toContain('How Many Copies if Hand Delivered');
    expect(projectInfoTasks).toContain('Type of Proposal');
    expect(projectInfoTasks).toContain('RFI Format');
    expect(projectInfoTasks).toContain('RFI Format - Other (Specify)');
    expect(projectInfoTasks).toContain("Owner's Point of Contact");
    expect(projectInfoTasks).toContain('Owner Contact Phone');
    expect(projectInfoTasks).toContain('Owner Contact Email');
    expect(projectInfoTasks).toContain('Assigned Estimator(s)');
  });

  it('has correct parentField for phone, email, and RFIFormatOther rows', () => {
    const phone = items.find(i => i.task === 'Owner Contact Phone');
    const email = items.find(i => i.task === 'Owner Contact Email');
    const rfiOther = items.find(i => i.task === 'RFI Format - Other (Specify)');
    expect(phone?.parentField).toBe('OwnerContactPhone');
    expect(email?.parentField).toBe('OwnerContactEmail');
    expect(rfiOther?.parentField).toBe('RFIFormatOther');
  });

  it('contains all Excel managing rows', () => {
    const managingTasks = items.filter(i => i.section === 'managing').map(i => i.task);
    expect(managingTasks).toContain('Finalize Subcontractor Bid List in BC');
    expect(managingTasks).toContain('Send ITB to Subcontractors');
    expect(managingTasks).toContain('Complete Bid Packages');
    expect(managingTasks).toContain('Complete Scope Sheets');
    expect(managingTasks).toContain('RFI Management (Point Person)');
    expect(managingTasks).toContain('VDC Coordination');
    expect(managingTasks).toContain('VDC Clash Detection');
    expect(managingTasks).toContain('Submit Permit and NOC');
  });

  it('contains all updated key_dates rows with Schedule prefix', () => {
    const keyDates = items.filter(i => i.section === 'key_dates');
    expect(keyDates).toHaveLength(6);
    expect(keyDates.map(i => i.task)).toEqual([
      "HB's Proposal Due",
      'Subcontractor Proposals Due',
      'Schedule Pre-Submission Estimate Review',
      'Schedule Win Strategy Meeting',
      'Schedule Subcontractor Site Walk-Thru',
      'Schedule Owner Estimate Review',
    ]);
    // All key_dates items must have parentField set
    for (const kd of keyDates) {
      expect(kd.parentField).toBeDefined();
      expect(kd.parentField!.length).toBeGreaterThan(0);
    }
  });

  it('contains all Excel standard deliverable rows', () => {
    const standard = items.filter(i => i.section === 'deliverables_standard').map(i => i.task);
    expect(standard).toContain('Front Cover');
    expect(standard).toContain('Executive Summary');
    expect(standard).toContain('Cost Summary');
    expect(standard).toContain('BIM Proposal Required');
    expect(standard).toContain('By Who List');
    expect(standard).toContain('Back Cover');
  });

  it('contains non-standard deliverables with 3 custom Other rows', () => {
    const nonStandard = items.filter(i => i.section === 'deliverables_nonstandard');
    expect(nonStandard).toHaveLength(9);
    expect(nonStandard.filter(i => i.task === 'Other')).toHaveLength(3);
    expect(nonStandard.filter(i => i.isCustom)).toHaveLength(3);
  });

  it('sets parentField for all project_info items', () => {
    const projectInfo = items.filter(i => i.section === 'project_info');
    for (const pi of projectInfo) {
      expect(pi.parentField).toBeDefined();
      expect(pi.parentField!.length).toBeGreaterThan(0);
    }
  });

  it('all items have sequential IDs and sortOrder', () => {
    for (let i = 0; i < items.length; i++) {
      expect(items[i].id).toBe(i + 1);
      expect(items[i].sortOrder).toBe(i + 1);
    }
  });

  it('all items start with null status, empty fields, and null deliverableStatus', () => {
    for (const item of items) {
      expect(item.status).toBeNull();
      expect(item.responsibleParty).toBe('');
      expect(item.deadline).toBe('');
      expect(item.notes).toBe('');
      expect(item.deliverableStatus).toBeNull();
    }
  });

  it('standard deliverables have correct tabRequired flags', () => {
    const standard = items.filter(i => i.section === 'deliverables_standard');
    const frontCover = standard.find(i => i.task === 'Front Cover');
    const gcBreakdown = standard.find(i => i.task === 'Detailed GC/GC Breakdown (optional)');
    expect(frontCover?.tabRequired).toBe(true);
    expect(gcBreakdown?.tabRequired).toBeUndefined();
  });
});
