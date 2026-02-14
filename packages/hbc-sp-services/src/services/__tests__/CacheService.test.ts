import { CacheService } from '../CacheService';

describe('CacheService', () => {
  let service: CacheService;
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    jest.useFakeTimers();

    // Mock sessionStorage
    mockStorage = {};
    const storageMock: Storage = {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => { mockStorage[key] = value; },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
      get length() { return Object.keys(mockStorage).length; },
      key: (index: number) => Object.keys(mockStorage)[index] ?? null,
    };

    Object.defineProperty(global, 'sessionStorage', {
      value: storageMock,
      writable: true,
      configurable: true,
    });

    service = new CacheService(5000); // 5 second TTL for tests
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('memory cache', () => {
    it('set and get returns cached value', () => {
      service.set('key1', { name: 'test' });
      const result = service.get<{ name: string }>('key1');
      expect(result).toEqual({ name: 'test' });
    });

    it('get returns null for expired entry', () => {
      service.set('key1', 'value');

      // Advance past TTL
      jest.advanceTimersByTime(6000);
      jest.setSystemTime(Date.now() + 6000);

      // Need to use real Date.now() advancement
      const originalDateNow = Date.now;
      let offset = 6000;
      Date.now = () => originalDateNow() + offset;

      const result = service.get('key1');
      expect(result).toBeNull();

      Date.now = originalDateNow;
    });

    it('get returns null for missing key', () => {
      expect(service.get('nonexistent')).toBeNull();
    });

    it('remove deletes entry', () => {
      service.set('key1', 'value');
      service.remove('key1');
      expect(service.get('key1')).toBeNull();
    });

    it('clear removes all entries', () => {
      service.set('hbc_key1', 'a');
      service.set('hbc_key2', 'b');
      service.clear();
      // Memory cache is cleared unconditionally; sessionStorage clears hbc_ prefixed keys
      expect(service.get('hbc_key1')).toBeNull();
      expect(service.get('hbc_key2')).toBeNull();
    });

    it('has returns true for valid entry', () => {
      service.set('key1', 'value');
      expect(service.has('key1')).toBe(true);
    });

    it('has returns false for missing key', () => {
      expect(service.has('nonexistent')).toBe(false);
    });

    it('custom TTL overrides default', () => {
      const originalDateNow = Date.now;
      const startTime = originalDateNow();
      Date.now = () => startTime;

      service.set('short', 'value', 1000); // 1 second TTL
      service.set('long', 'value', 10000); // 10 second TTL

      // Advance 2 seconds
      Date.now = () => startTime + 2000;

      expect(service.get('short')).toBeNull();
      expect(service.get('long')).toBe('value');

      Date.now = originalDateNow;
    });

    it('stores complex objects', () => {
      const obj = { nested: { array: [1, 2, 3] }, flag: true };
      service.set('complex', obj);
      expect(service.get('complex')).toEqual(obj);
    });
  });

  describe('sessionStorage interaction', () => {
    it('set writes to sessionStorage', () => {
      service.set('key1', 'value');
      expect(mockStorage['key1']).toBeDefined();
      const stored = JSON.parse(mockStorage['key1']);
      expect(stored.data).toBe('value');
    });

    it('remove deletes from sessionStorage', () => {
      service.set('key1', 'value');
      expect(mockStorage['key1']).toBeDefined();
      service.remove('key1');
      expect(mockStorage['key1']).toBeUndefined();
    });

    it('clear only removes hbc_ prefixed keys from sessionStorage', () => {
      mockStorage['hbc_cache1'] = JSON.stringify({ data: 'a', expiry: Date.now() + 10000 });
      mockStorage['hbc_cache2'] = JSON.stringify({ data: 'b', expiry: Date.now() + 10000 });
      mockStorage['other_key'] = 'should stay';

      service.clear();

      expect(mockStorage['hbc_cache1']).toBeUndefined();
      expect(mockStorage['hbc_cache2']).toBeUndefined();
      expect(mockStorage['other_key']).toBe('should stay');
    });

    it('get rehydrates memory cache from valid sessionStorage entry', () => {
      // Directly place in sessionStorage (bypassing memory cache)
      const expiry = Date.now() + 10000;
      mockStorage['direct'] = JSON.stringify({ data: 'from-storage', expiry });

      // A fresh service won't have it in memory
      const freshService = new CacheService(5000);
      const result = freshService.get<string>('direct');
      expect(result).toBe('from-storage');

      // Now it should be in memory too (second get is from memory)
      expect(freshService.get<string>('direct')).toBe('from-storage');
    });

    it('handles sessionStorage errors gracefully', () => {
      // Override sessionStorage to throw on setItem
      const originalSetItem = sessionStorage.setItem;
      sessionStorage.setItem = () => { throw new Error('QuotaExceeded'); };

      // Should not throw — memory cache still works
      expect(() => service.set('key1', 'value')).not.toThrow();
      expect(service.get('key1')).toBe('value'); // Still in memory

      sessionStorage.setItem = originalSetItem;
    });
  });

  describe('default TTL', () => {
    it('uses 15 minutes when no TTL specified in constructor', () => {
      const defaultService = new CacheService();
      const originalDateNow = Date.now;
      const startTime = originalDateNow();
      Date.now = () => startTime;

      defaultService.set('key', 'value');

      // 14 minutes — still valid
      Date.now = () => startTime + 14 * 60 * 1000;
      expect(defaultService.get('key')).toBe('value');

      // 16 minutes — expired
      Date.now = () => startTime + 16 * 60 * 1000;
      expect(defaultService.get('key')).toBeNull();

      Date.now = originalDateNow;
    });
  });
});
