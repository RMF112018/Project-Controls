import {
  detectEscalation,
  assertNotSelfEscalation,
  PermissionEscalationError,
  checkRateLimit,
  RateLimitError,
  resetRateLimiter,
} from '../escalationGuard';
import type { ICurrentUser } from '../../models/IRole';
import { RoleName } from '../../models/enums';

function makeUser(permissions: string[]): ICurrentUser {
  return {
    id: 1,
    displayName: 'Test User',
    email: 'test@hbc.com',
    loginName: 'test@hbc.com',
    roles: [RoleName.ExecutiveLeadership],
    permissions: new Set(permissions),
  };
}

describe('escalationGuard', () => {
  describe('detectEscalation', () => {
    it('returns empty when user has all permissions', () => {
      const user = makeUser(['READ', 'WRITE', 'ADMIN']);
      expect(detectEscalation(user, ['READ', 'WRITE'])).toHaveLength(0);
    });

    it('returns escalated permissions user does not hold', () => {
      const user = makeUser(['READ']);
      const escalated = detectEscalation(user, ['READ', 'WRITE', 'ADMIN']);
      expect(escalated).toEqual(['WRITE', 'ADMIN']);
    });
  });

  describe('assertNotSelfEscalation', () => {
    it('throws when user tries to grant permissions they lack', () => {
      const user = makeUser(['READ']);
      expect(() => assertNotSelfEscalation(user, ['READ', 'ADMIN'])).toThrow(PermissionEscalationError);
    });

    it('passes when user has all permissions in the role', () => {
      const user = makeUser(['READ', 'WRITE', 'ADMIN']);
      expect(() => assertNotSelfEscalation(user, ['READ', 'WRITE'])).not.toThrow();
    });

    it('error includes user email and attempted permissions', () => {
      const user = makeUser(['READ']);
      try {
        assertNotSelfEscalation(user, ['READ', 'ADMIN', 'SUPER']);
        fail('Expected error');
      } catch (err) {
        const e = err as PermissionEscalationError;
        expect(e.userEmail).toBe('test@hbc.com');
        expect(e.attemptedPermissions).toEqual(['ADMIN', 'SUPER']);
      }
    });
  });

  describe('checkRateLimit', () => {
    beforeEach(() => {
      resetRateLimiter();
    });

    it('allows within rate limit', () => {
      for (let i = 0; i < 10; i++) {
        expect(() => checkRateLimit('test@hbc.com', 'createRole')).not.toThrow();
      }
    });

    it('throws at 11th call within window', () => {
      for (let i = 0; i < 10; i++) {
        checkRateLimit('test@hbc.com', 'createRole');
      }
      expect(() => checkRateLimit('test@hbc.com', 'createRole')).toThrow(RateLimitError);
    });

    it('allows after window expires', () => {
      const realNow = Date.now;
      let mockTime = Date.now();
      Date.now = () => mockTime;

      try {
        for (let i = 0; i < 10; i++) {
          checkRateLimit('test@hbc.com', 'updateRole');
        }
        // Advance time past the 60s window
        mockTime += 61 * 1000;
        expect(() => checkRateLimit('test@hbc.com', 'updateRole')).not.toThrow();
      } finally {
        Date.now = realNow;
      }
    });

    it('resetRateLimiter clears state', () => {
      for (let i = 0; i < 10; i++) {
        checkRateLimit('test@hbc.com', 'createRole');
      }
      resetRateLimiter();
      expect(() => checkRateLimit('test@hbc.com', 'createRole')).not.toThrow();
    });
  });
});
