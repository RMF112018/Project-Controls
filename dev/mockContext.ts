import { RoleName } from '@hbc/sp-services';

// ---------------------------------------------------------------------------
// Dev-only mock role state
// ---------------------------------------------------------------------------

let currentMockRole: RoleName = RoleName.ExecutiveLeadership;

/** Get the currently selected mock role (dev server only). */
export function getMockUserRole(): RoleName {
  return currentMockRole;
}

/** Set the mock role — used by the RoleSwitcher toolbar. */
export function setMockUserRole(role: RoleName): void {
  currentMockRole = role;
}

/**
 * Mock SPFx-like context object.
 * The app code does NOT reference pageContext directly — this exists
 * purely as a safety net and for future-proofing.
 */
export const mockContext = {
  pageContext: {
    user: {
      displayName: 'Bobby Fetting',
      email: 'bfetting@hedrickbrothers.com',
      loginName: 'bfetting@hedrickbrothers.com',
    },
    web: {
      title: 'HBC Hub',
      absoluteUrl: 'https://hedrickbrothers.sharepoint.com/sites/HBCHub',
      serverRelativeUrl: '/sites/HBCHub',
    },
    site: {
      absoluteUrl: 'https://hedrickbrothers.sharepoint.com/sites/HBCHub',
      serverRelativeUrl: '/sites/HBCHub',
      id: { toString: (): string => '00000000-0000-0000-0000-000000000000' },
    },
    legacyPageContext: {},
  },
  serviceScope: {
    consume: (): undefined => undefined,
  },
};
