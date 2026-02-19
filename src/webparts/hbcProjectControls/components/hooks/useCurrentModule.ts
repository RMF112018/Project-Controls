import { useLocation } from '@router';
import { useMemo } from 'react';

interface IModuleMapping {
  pattern: RegExp;
  key: string;
}

/**
 * Static map from URL pathname patterns to moduleKey strings.
 * More specific patterns are listed first so they match before broader patterns.
 */
const MODULE_MAP: IModuleMapping[] = [
  // Admin
  { pattern: /^\/admin\/application-support$/, key: 'admin-application-support' },
  { pattern: /^\/admin\/performance$/, key: 'admin-performance' },
  { pattern: /^\/admin$/, key: 'admin' },

  // Lead
  { pattern: /^\/lead\/new$/, key: 'lead-form' },
  { pattern: /^\/lead\/\d+\/gonogo\/detail$/, key: 'gonogo-detail' },
  { pattern: /^\/lead\/\d+\/gonogo$/, key: 'gonogo' },
  { pattern: /^\/lead\/\d+\/schedule-gonogo$/, key: 'gonogo-meeting' },
  { pattern: /^\/lead\/\d+$/, key: 'lead-detail' },

  // Preconstruction — pursuit sub-routes
  { pattern: /^\/preconstruction\/pursuit\/\d+\/kickoff$/, key: 'estimating-kickoff' },
  { pattern: /^\/preconstruction\/pursuit\/\d+\/interview$/, key: 'interview-prep' },
  { pattern: /^\/preconstruction\/pursuit\/\d+\/winloss$/, key: 'winloss' },
  { pattern: /^\/preconstruction\/pursuit\/\d+\/turnover$/, key: 'turnover' },
  { pattern: /^\/preconstruction\/pursuit\/\d+\/autopsy-form$/, key: 'autopsy-form' },
  { pattern: /^\/preconstruction\/pursuit\/\d+\/autopsy$/, key: 'loss-autopsy' },
  { pattern: /^\/preconstruction\/pursuit\/\d+\/deliverables$/, key: 'deliverables' },
  { pattern: /^\/preconstruction\/pursuit\/\d+$/, key: 'pursuit-detail' },

  // Preconstruction — hub views
  { pattern: /^\/preconstruction\/pipeline\/gonogo$/, key: 'gonogo-tracker' },
  { pattern: /^\/preconstruction\/pipeline$/, key: 'pipeline' },
  { pattern: /^\/preconstruction\/gonogo$/, key: 'gonogo-tracker' },
  { pattern: /^\/preconstruction\/precon-tracker$/, key: 'precon-tracker' },
  { pattern: /^\/preconstruction\/estimate-log$/, key: 'estimate-log' },
  { pattern: /^\/preconstruction\/kickoff-list$/, key: 'kickoff-list' },
  { pattern: /^\/preconstruction\/autopsy-list$/, key: 'autopsy-list' },
  { pattern: /^\/preconstruction$/, key: 'estimating' },

  // Operations — project-specific
  { pattern: /^\/operations\/startup-checklist$/, key: 'startup-checklist' },
  { pattern: /^\/operations\/management-plan$/, key: 'pmp' },
  { pattern: /^\/operations\/superintendent-plan$/, key: 'superintendent-plan' },
  { pattern: /^\/operations\/responsibility\/owner-contract$/, key: 'owner-contract-matrix' },
  { pattern: /^\/operations\/responsibility\/sub-contract$/, key: 'sub-contract-matrix' },
  { pattern: /^\/operations\/responsibility$/, key: 'responsibility-matrices' },
  { pattern: /^\/operations\/closeout-checklist$/, key: 'closeout-checklist' },
  { pattern: /^\/operations\/buyout-log$/, key: 'buyout-log' },
  { pattern: /^\/operations\/contract-tracking$/, key: 'contract-tracking' },
  { pattern: /^\/operations\/compliance-log$/, key: 'compliance-log' },
  { pattern: /^\/operations\/risk-cost$/, key: 'risk-cost' },
  { pattern: /^\/operations\/schedule$/, key: 'schedule' },
  { pattern: /^\/operations\/quality-concerns$/, key: 'quality-concerns' },
  { pattern: /^\/operations\/safety-concerns$/, key: 'safety-concerns' },
  { pattern: /^\/operations\/monthly-review$/, key: 'monthly-review' },
  { pattern: /^\/operations\/project-record$/, key: 'project-record' },
  { pattern: /^\/operations\/lessons-learned$/, key: 'lessons-learned' },
  { pattern: /^\/operations\/gonogo$/, key: 'gonogo' },
  { pattern: /^\/operations\/project$/, key: 'project-dashboard' },
  { pattern: /^\/operations$/, key: 'active-projects' },

  // Marketing
  { pattern: /^\/marketing$/, key: 'marketing' },

  // Job request
  { pattern: /^\/job-request(\/\d+)?$/, key: 'job-request' },

  // Accounting
  { pattern: /^\/accounting-queue$/, key: 'accounting-queue' },

  // Dashboard (root)
  { pattern: /^\/$/, key: 'dashboard' },
];

/**
 * Returns the moduleKey string for the current route pathname,
 * or null if no module matches.
 */
export function useCurrentModule(): string | null {
  const { pathname } = useLocation();

  return useMemo(() => {
    for (const entry of MODULE_MAP) {
      if (entry.pattern.test(pathname)) {
        return entry.key;
      }
    }
    return null;
  }, [pathname]);
}
