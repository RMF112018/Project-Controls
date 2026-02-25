import {
  sanitizeODataString,
  sanitizeODataNumber,
  safeODataEq,
  safeODataSubstringOf,
  ODataSanitizationError,
} from '../odataSanitizer';

describe('odataSanitizer', () => {
  describe('sanitizeODataString', () => {
    it('escapes single quotes', () => {
      expect(sanitizeODataString("O'Brien")).toBe("O''Brien");
    });

    it('strips control characters', () => {
      expect(sanitizeODataString('abc\x00\x1Fdef\x7F')).toBe('abcdef');
    });

    it('enforces max length', () => {
      const long = 'a'.repeat(300);
      expect(sanitizeODataString(long, 255)).toHaveLength(255);
    });

    it('throws on null', () => {
      expect(() => sanitizeODataString(null)).toThrow(ODataSanitizationError);
    });

    it('throws on undefined', () => {
      expect(() => sanitizeODataString(undefined)).toThrow(ODataSanitizationError);
    });
  });

  describe('sanitizeODataNumber', () => {
    it('rejects NaN', () => {
      expect(() => sanitizeODataNumber('not-a-number')).toThrow(ODataSanitizationError);
    });

    it('rejects Infinity', () => {
      expect(() => sanitizeODataNumber(Infinity)).toThrow(ODataSanitizationError);
    });

    it('passes valid numbers', () => {
      expect(sanitizeODataNumber(42)).toBe(42);
      expect(sanitizeODataNumber('3.14')).toBe(3.14);
      expect(sanitizeODataNumber(0)).toBe(0);
    });
  });

  describe('safeODataEq', () => {
    it('produces correct eq filter', () => {
      expect(safeODataEq('Stage', 'Active')).toBe("Stage eq 'Active'");
    });

    it('blocks injection payload by escaping quotes', () => {
      const payload = "Active' or 1 eq 1 or Stage eq '";
      const result = safeODataEq('Stage', payload);
      // The single quotes in the payload are doubled, making them literal chars
      expect(result).toBe("Stage eq 'Active'' or 1 eq 1 or Stage eq '''");
      // Verify the quotes around the value are intact (injection neutralized)
      expect(result.startsWith("Stage eq '")).toBe(true);
      expect(result.endsWith("'")).toBe(true);
    });
  });

  describe('safeODataSubstringOf', () => {
    it('produces correct substringof filter', () => {
      expect(safeODataSubstringOf('Title', 'Hedrick')).toBe("substringof('Hedrick', Title)");
    });

    it('blocks injection in substringof by escaping quotes', () => {
      const payload = "test'), true) or (substringof('";
      const result = safeODataSubstringOf('Title', payload);
      // All single quotes in the payload are doubled
      expect(result).toContain("''");
      // Verify proper wrapping — injection is neutralized as literal text
      expect(result).toBe("substringof('test''), true) or (substringof(''', Title)");
    });
  });
});
