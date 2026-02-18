/**
 * Standalone runtime bootstrap:
 * - creates authenticated SPFI
 * - auto-detects hub vs project context from live site URL
 * - resolves Graph group membership for RBAC (with safe fallback)
 */
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import type { AccountInfo, AuthenticationResult, IPublicClientApplication } from '@azure/msal-browser';
import { BrowserFetch } from '@pnp/queryable/behaviors/browser-fetch';
import { spfi, SPFI } from '@pnp/sp';
import { DefaultHeaders, DefaultInit } from '@pnp/sp/behaviors/defaults';
import type { ISiteContext } from '@hbc/sp-services';
import { detectSiteContext } from '@hbc/sp-services';
import { MsalBehavior } from './MsalBehavior';

import '@pnp/sp/batching';
import '@pnp/sp/files';
import '@pnp/sp/folders';
import '@pnp/sp/hubsites';
import '@pnp/sp/items';
import '@pnp/sp/lists';
import '@pnp/sp/site-users/web';
import '@pnp/sp/webs';

export interface IStandaloneGraphMembership {
  groupIds: Set<string>;
  groupNames: Set<string>;
}

export interface IStandaloneAccountProfile {
  aadObjectId: string;
  email: string;
  displayName: string;
}

export interface IStandaloneRuntimeContext {
  sp: SPFI;
  siteContext: ISiteContext;
  graphMembership: IStandaloneGraphMembership;
  accountProfile: IStandaloneAccountProfile;
}

const GRAPH_TRANSITIVE_GROUPS_URL = 'https://graph.microsoft.com/v1.0/me/transitiveMemberOf/microsoft.graph.group?$select=id,displayName&$top=999';
const SP_SITE_OVERRIDE = process.env.SP_SITE_URL;

function createSpfiInstance(
  msalInstance: IPublicClientApplication,
  account: AccountInfo,
  siteUrl: string,
  scope: string
): SPFI {
  return spfi(siteUrl).using(
    DefaultHeaders(),
    DefaultInit(),
    BrowserFetch(),
    MsalBehavior(msalInstance, account, scope)
  );
}

async function acquireGraphToken(
  msalInstance: IPublicClientApplication,
  account: AccountInfo,
  graphScopes: string[]
): Promise<AuthenticationResult> {
  try {
    return await msalInstance.acquireTokenSilent({ account, scopes: graphScopes });
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      return msalInstance.acquireTokenPopup({ account, scopes: graphScopes });
    }
    throw error;
  }
}

async function getCurrentUserGraphMembership(
  msalInstance: IPublicClientApplication,
  account: AccountInfo,
  graphScopes: string[]
): Promise<IStandaloneGraphMembership> {
  const groupIds = new Set<string>();
  const groupNames = new Set<string>();

  if (graphScopes.length === 0) return { groupIds, groupNames };

  try {
    const token = await acquireGraphToken(msalInstance, account, graphScopes);
    let nextUrl: string | undefined = GRAPH_TRANSITIVE_GROUPS_URL;

    while (nextUrl) {
      const response = await fetch(nextUrl, {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Graph membership request failed (${response.status})`);
      }

      const payload = (await response.json()) as {
        value?: Array<{ id?: string; displayName?: string }>;
        '@odata.nextLink'?: string;
      };

      for (const group of payload.value ?? []) {
        if (group.id) groupIds.add(group.id.toLowerCase());
        if (group.displayName) groupNames.add(group.displayName.trim().toLowerCase());
      }

      nextUrl = payload['@odata.nextLink'];
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Standalone] Graph membership lookup failed; using email fallback only. ${message}`);
  }

  return { groupIds, groupNames };
}

function assertTenantOriginMatch(liveSiteUrl: string, hubSiteUrl: string): void {
  const liveOrigin = new URL(liveSiteUrl).origin.toLowerCase();
  const hubOrigin = new URL(hubSiteUrl).origin.toLowerCase();
  if (liveOrigin !== hubOrigin) {
    throw new Error(`[Standalone] Cross-tenant site detection blocked (${liveOrigin} !== ${hubOrigin}).`);
  }
}

export async function createStandaloneRuntimeContext(
  msalInstance: IPublicClientApplication,
  account: AccountInfo,
  hubSiteUrl: string,
  sharePointScope: string,
  graphScopes: string[],
  siteUrlOverride?: string
): Promise<IStandaloneRuntimeContext> {
  const targetSiteUrl = siteUrlOverride || SP_SITE_OVERRIDE || hubSiteUrl;
  const sp = createSpfiInstance(msalInstance, account, targetSiteUrl, sharePointScope);
  const webInfo = await sp.web.select('Url')<{ Url: string }>();
  assertTenantOriginMatch(webInfo.Url, hubSiteUrl);

  const siteContext = detectSiteContext(webInfo.Url, hubSiteUrl);
  const graphMembership = await getCurrentUserGraphMembership(msalInstance, account, graphScopes);
  const accountProfile: IStandaloneAccountProfile = {
    aadObjectId: account.localAccountId || account.homeAccountId,
    email: account.username,
    displayName: account.name || account.username,
  };

  return { sp, siteContext, graphMembership, accountProfile };
}

export function createStandaloneSpfi(
  msalInstance: IPublicClientApplication,
  account: AccountInfo,
  hubSiteUrl: string,
  scope: string
): SPFI {
  return createSpfiInstance(msalInstance, account, hubSiteUrl, scope);
}

export type { SPFI };
