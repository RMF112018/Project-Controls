import { SharePointDataService } from './SharePointDataService';
import { OfflineQueueService } from './OfflineQueueService';
import { createDelegatingService } from './createDelegatingService';
import type { IDataService } from './IDataService';
import type { ISiteContext } from '../utils/siteDetector';
import {
  buildStandaloneCurrentUser,
  type IStandaloneGraphMembership,
  resolveStandalonePermissions,
} from './standalone/resolveStandaloneRoles';

interface IContextUser {
  displayName: string;
  email: string;
  loginName: string;
  id: number;
}

export interface IStandaloneRbacContext {
  siteContext?: ISiteContext;
  graphMembership?: IStandaloneGraphMembership;
}

/**
 * IBinaryAttachment — QC Phase readiness: supports photos, markup overlays, and signatures.
 * Methods using this type are optional today; they become required when QC offline is built.
 */
export interface IBinaryAttachment {
  /** Attachment category — drives caching strategy and SP library routing */
  type: 'photo' | 'signature' | 'markup' | 'pdf';
  /** Raw binary or base64-encoded string */
  content: ArrayBuffer | Blob | string;
  mimeType: string;
  fileName: string;
  metadata?: {
    capturedAt: string;           // ISO 8601 — when captured on device
    capturedBy: string;           // email of field user
    deviceId?: string;            // optional device fingerprint
    gpsCoords?: [number, number]; // lat/lng if geolocation granted
    /** Serialized JSON from canvas annotation overlay (e.g. Konva/Fabric.js layer) */
    markupJson?: string;
  };
}

/**
 * Standalone (non-SPFx) IDataService implementation using Proxy delegation.
 * COMPOSITION: wraps SharePointDataService via createDelegatingService().
 * Auth-agnostic: accepts pre-configured SPFI from dev/auth/createStandaloneSpfi.ts.
 *
 * Zero manual method delegation — Proxy forwards all 244 IDataService methods
 * automatically. New IDataService methods are handled without any code changes here.
 *
 * Usage (dev/auth/MSALAuthProvider.tsx):
 *   const sp = createStandaloneSpfi(msalInstance, account, hubUrl, SP_SCOPE);
 *   const svc = StandaloneSharePointDataService.create(sp, { displayName, email, loginName, id: 0 });
 *   // svc satisfies IDataService — pass to <App dataService={svc} />
 */
export class StandaloneSharePointDataService {
  /**
   * Static factory — two-phase init mirrors HbcProjectControlsWebPart.onInit().
   * Returns IDataService (not StandaloneSharePointDataService) to keep consumers
   * against the interface, not the concrete class.
  */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static create(spfi: any, user: IContextUser, standaloneContext?: IStandaloneRbacContext): IDataService {
    const inner = new SharePointDataService();
    inner.initialize(spfi);
    inner.initializeContext(user);

    // Instantiate for future offline-queue override usage
    void new OfflineQueueService();

    // Override map: add method-level offline-queue wrapping here as needed.
    // PHASE 1 LAUNCH: empty — all 244 methods delegate to inner directly.
    // QC ENHANCEMENT EXAMPLE (uncomment when QC offline mode is implemented):
    //
    //   createQualityConcern: async (data) => {
    //     if (!navigator.onLine) {
    //       await offlineQueue.enqueue({ method: 'createQualityConcern', args: [data] });
    //       throw new Error('Offline — queued for sync');
    //     }
    //     return inner.createQualityConcern(data);
    //   },

    const overrides: Partial<IDataService> = {
      getCurrentUser: async () => {
        const roles = await inner.getRoles();
        return buildStandaloneCurrentUser(
          user,
          roles,
          standaloneContext?.graphMembership ?? { groupIds: new Set<string>(), groupNames: new Set<string>() }
        );
      },
      resolveUserPermissions: async (userEmail: string, projectCode: string | null) => {
        const roles = await inner.getRoles();
        const currentUser = buildStandaloneCurrentUser(
          { ...user, email: userEmail, loginName: `i:0#.f|membership|${userEmail}` },
          roles,
          standaloneContext?.graphMembership ?? { groupIds: new Set<string>(), groupNames: new Set<string>() }
        );
        return resolveStandalonePermissions({
          dataService: inner,
          userEmail,
          projectCode,
          roles: currentUser.roles,
        });
      },
    };

    return createDelegatingService(inner, overrides);
  }
}
