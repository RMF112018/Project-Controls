export interface IBreadcrumbItem {
  label: string;
  path?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  '': 'Dashboard',
  'marketing': 'Marketing Dashboard',
  'preconstruction': 'Estimating Dashboard',
  'gonogo': 'Go/No-Go Tracker',
  'pipeline': 'Pipeline',
  'precon-tracker': 'Precon Tracker',
  'estimate-log': 'Estimate Log',
  'kickoff-list': 'Kick-Off Checklists',
  'autopsy-list': 'Post-Bid Autopsies',
  'pursuit': 'Pursuit',
  'kickoff': 'Kick-Off',
  'interview': 'Interview Prep',
  'winloss': 'Win/Loss',
  'turnover': 'Turnover',
  'autopsy': 'Loss Autopsy',
  'autopsy-form': 'Autopsy Form',
  'deliverables': 'Deliverables',
  'lead': 'Lead',
  'new': 'New Lead',
  'schedule-gonogo': 'Schedule Go/No-Go',
  'detail': 'Scorecard Detail',
  'operations': 'Active Projects',
  'project': 'Project Dashboard',
  'project-settings': 'Project Settings',
  'startup-checklist': 'Startup Checklist',
  'management-plan': 'Management Plan',
  'superintendent-plan': "Super's Plan",
  'responsibility': 'Responsibility Matrices',
  'owner-contract': 'Owner Contract',
  'sub-contract': 'Sub-Contract',
  'closeout-checklist': 'Closeout Checklist',
  'buyout-log': 'Buyout Log',
  'contract-tracking': 'Contract Tracking',
  'compliance-log': 'Compliance Log',
  'risk-cost': 'Risk & Cost',
  'schedule': 'Schedule',
  'quality-concerns': 'Quality Concerns',
  'safety-concerns': 'Safety Concerns',
  'monthly-review': 'Monthly Review',
  'project-record': 'Project Record',
  'lessons-learned': 'Lessons Learned',
  'job-request': 'Job Number Request',
  'accounting-queue': 'Accounting Queue',
  'admin': 'Admin Panel',
};

/**
 * Builds breadcrumb items from a route pathname.
 * Numeric segments are treated as IDs and labeled with projectName if provided.
 */
export function buildBreadcrumbs(pathname: string, projectName?: string): IBreadcrumbItem[] {
  const segments = pathname.replace(/^\//, '').split('/').filter(Boolean);
  const items: IBreadcrumbItem[] = [{ label: 'Dashboard', path: '/' }];

  let currentPath = '';
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    // Numeric segments are entity IDs
    if (/^\d+$/.test(segment)) {
      items.push({ label: projectName || `#${segment}`, path: currentPath });
      continue;
    }

    const label = ROUTE_LABELS[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const isLast = i === segments.length - 1;
    items.push({ label, path: isLast ? undefined : currentPath });
  }

  return items;
}
