import { CACHE_KEYS } from '../../utils/constants';
import type { IMutationDescriptor, MutationMethodKey } from './types';

const leadsInvalidation = {
  queryFamilies: ['leads', 'activeProjects'],
  cacheTags: [CACHE_KEYS.LEADS, CACHE_KEYS.ACTIVE_PROJECTS],
  cachePrefixes: [CACHE_KEYS.LEADS, CACHE_KEYS.ACTIVE_PROJECTS],
  projectScoped: false,
} as const;

const estimatingInvalidation = {
  queryFamilies: ['estimating', 'preconstruction'],
  cacheTags: [CACHE_KEYS.ESTIMATES, CACHE_KEYS.KICKOFFS],
  cachePrefixes: [CACHE_KEYS.ESTIMATES, CACHE_KEYS.KICKOFFS],
  projectScoped: false,
} as const;

const buyoutInvalidation = {
  queryFamilies: ['buyout', 'compliance', 'dataMart'],
  cacheTags: [CACHE_KEYS.BUYOUT, CACHE_KEYS.RISK_COST, CACHE_KEYS.DATA_MART],
  cachePrefixes: [CACHE_KEYS.BUYOUT, CACHE_KEYS.RISK_COST, CACHE_KEYS.DATA_MART],
  projectScoped: true,
} as const;

const pmpInvalidation = {
  queryFamilies: ['pmp', 'project'],
  cacheTags: [CACHE_KEYS.PMP, CACHE_KEYS.PROJECTS],
  cachePrefixes: [CACHE_KEYS.PMP, CACHE_KEYS.PROJECTS],
  projectScoped: true,
} as const;

export const waveAMutationCatalog: Partial<Record<MutationMethodKey, IMutationDescriptor>> = {
  createLead: {
    method: 'createLead',
    domain: 'leads',
    optimisticStrategy: 'append',
    invalidation: leadsInvalidation,
  },
  updateLead: {
    method: 'updateLead',
    domain: 'leads',
    optimisticStrategy: 'replaceById',
    invalidation: leadsInvalidation,
  },
  deleteLead: {
    method: 'deleteLead',
    domain: 'leads',
    optimisticStrategy: 'removeById',
    invalidation: leadsInvalidation,
  },
  createEstimatingRecord: {
    method: 'createEstimatingRecord',
    domain: 'estimating',
    optimisticStrategy: 'append',
    invalidation: estimatingInvalidation,
  },
  updateEstimatingRecord: {
    method: 'updateEstimatingRecord',
    domain: 'estimating',
    optimisticStrategy: 'replaceById',
    invalidation: estimatingInvalidation,
  },
  addBuyoutEntry: {
    method: 'addBuyoutEntry',
    domain: 'buyout',
    optimisticStrategy: 'append',
    invalidation: buyoutInvalidation,
  },
  updateBuyoutEntry: {
    method: 'updateBuyoutEntry',
    domain: 'buyout',
    optimisticStrategy: 'replaceById',
    invalidation: buyoutInvalidation,
  },
  removeBuyoutEntry: {
    method: 'removeBuyoutEntry',
    domain: 'buyout',
    optimisticStrategy: 'removeById',
    invalidation: buyoutInvalidation,
  },
  updateProjectManagementPlan: {
    method: 'updateProjectManagementPlan',
    domain: 'pmp',
    optimisticStrategy: 'merge',
    invalidation: pmpInvalidation,
  },
  submitPMPForApproval: {
    method: 'submitPMPForApproval',
    domain: 'pmp',
    optimisticStrategy: 'merge',
    invalidation: pmpInvalidation,
  },
  respondToPMPApproval: {
    method: 'respondToPMPApproval',
    domain: 'pmp',
    optimisticStrategy: 'merge',
    invalidation: pmpInvalidation,
  },
  signPMP: {
    method: 'signPMP',
    domain: 'pmp',
    optimisticStrategy: 'merge',
    invalidation: pmpInvalidation,
  },
};
