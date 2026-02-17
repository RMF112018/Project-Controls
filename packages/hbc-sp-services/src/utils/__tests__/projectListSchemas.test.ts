/**
 * Project List Schema validation tests.
 * Ensures schema integrity for the project-site lists used during provisioning.
 */
import { getProjectListSchemas, getBuyoutLogSchema, getActiveProjectsPortfolioSchema } from '../projectListSchemas';
import { IProjectListSchema, IFieldDefinition } from '../../models/IProvisioningLog';

const VALID_FIELD_TYPES: IFieldDefinition['fieldType'][] = [
  'Text', 'Note', 'Number', 'DateTime', 'Choice', 'Boolean', 'User', 'Currency', 'URL',
];

describe('projectListSchemas', () => {
  let schemas: IProjectListSchema[];

  beforeAll(() => {
    schemas = getProjectListSchemas();
  });

  it('exports all project-site list schemas', () => {
    // 44 schemas in the ALL_PROJECT_SCHEMAS array (Shared Documents created by default)
    expect(schemas).toHaveLength(44);
    expect(schemas.length).toBeGreaterThan(30);
  });

  it('each schema has required fields: listName, fields array, description', () => {
    for (const schema of schemas) {
      expect(schema.listName).toBeTruthy();
      expect(typeof schema.listName).toBe('string');
      expect(schema.description).toBeTruthy();
      expect(typeof schema.description).toBe('string');
      expect(Array.isArray(schema.fields)).toBe(true);
      expect(schema.fields.length).toBeGreaterThan(0);
      expect(typeof schema.templateType).toBe('number');
    }
  });

  it('no duplicate list titles', () => {
    const titles = schemas.map(s => s.listName);
    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBe(titles.length);
  });

  it('all field types are valid SharePoint field types', () => {
    for (const schema of schemas) {
      for (const field of schema.fields) {
        expect(VALID_FIELD_TYPES).toContain(field.fieldType);
      }
    }
  });

  it('schemas with Choice fields have a choices array', () => {
    for (const schema of schemas) {
      for (const field of schema.fields) {
        if (field.fieldType === 'Choice') {
          expect(Array.isArray(field.choices)).toBe(true);
        }
      }
    }
  });

  it('Buyout_Log schema has expected structure', () => {
    const buyout = getBuyoutLogSchema();
    expect(buyout.listName).toBe('Buyout_Log');
    expect(buyout.templateType).toBe(100);
    expect(buyout.fields.length).toBeGreaterThan(10);

    const fieldNames = buyout.fields.map(f => f.internalName);
    expect(fieldNames).toContain('projectCode');
    expect(fieldNames).toContain('divisionCode');
    expect(fieldNames).toContain('contractValue');
    expect(fieldNames).toContain('commitmentStatus');
  });

  it('Active_Projects_Portfolio schema has expected structure', () => {
    const portfolio = getActiveProjectsPortfolioSchema();
    expect(portfolio.listName).toBe('Active_Projects_Portfolio');
    expect(portfolio.templateType).toBe(100);
    expect(portfolio.fields.length).toBeGreaterThan(20);

    const fieldNames = portfolio.fields.map(f => f.internalName);
    expect(fieldNames).toContain('projectCode');
    expect(fieldNames).toContain('jobNumber');
    expect(fieldNames).toContain('financialsOriginalContract');
    expect(fieldNames).toContain('scheduleStartDate');
  });

  it('all fields have non-empty internalName and displayName', () => {
    for (const schema of schemas) {
      for (const field of schema.fields) {
        expect(field.internalName).toBeTruthy();
        expect(field.displayName).toBeTruthy();
      }
    }
  });
});
