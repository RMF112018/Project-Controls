import {
  validateLeadForm,
  validateProjectCode,
  validateEmail,
  isRequired,
  IValidationError,
} from '../validators';
import { ILeadFormData } from '../../models/ILead';
import { Region, Sector, Division, DepartmentOfOrigin, Stage } from '../../models/enums';

function validLeadFormData(): Partial<ILeadFormData> {
  return {
    Title: 'Test Project',
    ClientName: 'Acme Corp',
    Region: Region.Miami,
    Sector: Sector.Commercial,
    Division: Division.Commercial,
    DepartmentOfOrigin: DepartmentOfOrigin.BusinessDevelopment,
    AddressCity: 'Miami',
    AddressState: 'FL',
  };
}

describe('validators', () => {
  describe('validateLeadForm', () => {
    it('valid form returns no errors', () => {
      const errors = validateLeadForm(validLeadFormData());
      expect(errors).toHaveLength(0);
    });

    it('missing Title returns error', () => {
      const data = validLeadFormData();
      delete data.Title;
      const errors = validateLeadForm(data);
      expect(errors.some(e => e.field === 'Title')).toBe(true);
    });

    it('missing ClientName returns error', () => {
      const data = validLeadFormData();
      delete data.ClientName;
      const errors = validateLeadForm(data);
      expect(errors.some(e => e.field === 'ClientName')).toBe(true);
    });

    it('missing Region returns error', () => {
      const data = validLeadFormData();
      delete data.Region;
      const errors = validateLeadForm(data);
      expect(errors.some(e => e.field === 'Region')).toBe(true);
    });

    it('missing Sector returns error', () => {
      const data = validLeadFormData();
      delete data.Sector;
      const errors = validateLeadForm(data);
      expect(errors.some(e => e.field === 'Sector')).toBe(true);
    });

    it('missing Division returns error', () => {
      const data = validLeadFormData();
      delete data.Division;
      const errors = validateLeadForm(data);
      expect(errors.some(e => e.field === 'Division')).toBe(true);
    });

    it('missing DepartmentOfOrigin returns error', () => {
      const data = validLeadFormData();
      delete data.DepartmentOfOrigin;
      const errors = validateLeadForm(data);
      expect(errors.some(e => e.field === 'DepartmentOfOrigin')).toBe(true);
    });

    it('missing AddressCity returns error', () => {
      const data = validLeadFormData();
      delete data.AddressCity;
      const errors = validateLeadForm(data);
      expect(errors.some(e => e.field === 'AddressCity')).toBe(true);
    });

    it('missing AddressState returns error', () => {
      const data = validLeadFormData();
      delete data.AddressState;
      const errors = validateLeadForm(data);
      expect(errors.some(e => e.field === 'AddressState')).toBe(true);
    });

    it('negative ProjectValue returns error', () => {
      const data = { ...validLeadFormData(), ProjectValue: -100 };
      const errors = validateLeadForm(data);
      expect(errors.some(e => e.field === 'ProjectValue')).toBe(true);
    });

    it('zero ProjectValue returns no error', () => {
      const data = { ...validLeadFormData(), ProjectValue: 0 };
      const errors = validateLeadForm(data);
      expect(errors.some(e => e.field === 'ProjectValue')).toBe(false);
    });

    it('fee percentage > 100 returns error', () => {
      const data = { ...validLeadFormData(), AnticipatedFeePct: 101 };
      const errors = validateLeadForm(data);
      expect(errors.some(e => e.field === 'AnticipatedFeePct')).toBe(true);
    });

    it('fee percentage < 0 returns error', () => {
      const data = { ...validLeadFormData(), AnticipatedFeePct: -1 };
      const errors = validateLeadForm(data);
      expect(errors.some(e => e.field === 'AnticipatedFeePct')).toBe(true);
    });

    it('gross margin > 100 returns error', () => {
      const data = { ...validLeadFormData(), AnticipatedGrossMargin: 150 };
      const errors = validateLeadForm(data);
      expect(errors.some(e => e.field === 'AnticipatedGrossMargin')).toBe(true);
    });

    it('whitespace-only Title returns error', () => {
      const data = { ...validLeadFormData(), Title: '   ' };
      const errors = validateLeadForm(data);
      expect(errors.some(e => e.field === 'Title')).toBe(true);
    });

    it('empty string ClientName returns error', () => {
      const data = { ...validLeadFormData(), ClientName: '' };
      const errors = validateLeadForm(data);
      expect(errors.some(e => e.field === 'ClientName')).toBe(true);
    });

    it('returns multiple errors at once', () => {
      const errors = validateLeadForm({});
      // Should have errors for Title, ClientName, Region, Sector, Division, DepartmentOfOrigin, AddressCity, AddressState
      expect(errors.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('validateProjectCode', () => {
    it('valid code "25-042-01" returns true', () => {
      expect(validateProjectCode('25-042-01')).toBe(true);
    });

    it('valid code "24-008-01" returns true', () => {
      expect(validateProjectCode('24-008-01')).toBe(true);
    });

    it('invalid format without dashes returns false', () => {
      expect(validateProjectCode('2504201')).toBe(false);
    });

    it('invalid format with wrong digit counts returns false', () => {
      expect(validateProjectCode('2-042-01')).toBe(false);
      expect(validateProjectCode('25-42-01')).toBe(false);
      expect(validateProjectCode('25-042-1')).toBe(false);
    });

    it('empty string returns false', () => {
      expect(validateProjectCode('')).toBe(false);
    });

    it('letters return false', () => {
      expect(validateProjectCode('AB-CDE-FG')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('valid email returns true', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user@hedrickbrothers.com')).toBe(true);
    });

    it('invalid email returns false', () => {
      expect(validateEmail('notanemail')).toBe(false);
      expect(validateEmail('@no-local.com')).toBe(false);
      expect(validateEmail('no-domain@')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('isRequired', () => {
    it('null returns false', () => {
      expect(isRequired(null)).toBe(false);
    });

    it('undefined returns false', () => {
      expect(isRequired(undefined)).toBe(false);
    });

    it('empty string returns false', () => {
      expect(isRequired('')).toBe(false);
    });

    it('whitespace-only string returns false', () => {
      expect(isRequired('   ')).toBe(false);
    });

    it('non-empty string returns true', () => {
      expect(isRequired('hello')).toBe(true);
    });

    it('number returns true', () => {
      expect(isRequired(0)).toBe(true);
      expect(isRequired(42)).toBe(true);
    });

    it('boolean returns true', () => {
      expect(isRequired(false)).toBe(true);
      expect(isRequired(true)).toBe(true);
    });
  });
});
