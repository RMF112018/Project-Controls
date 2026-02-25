import type { IEstimatingTracker } from '../../models/IEstimatingTracker';
import { AwardStatus, EstimateSource, DeliverableType } from '../../models/enums';
import {
  SeededRandom,
  randomDateOnly,
  ESTIMATOR_NAMES,
  CLIENT_NAMES,
} from './helpers';

const SOURCES: readonly EstimateSource[] = [
  EstimateSource.ClientRequest, EstimateSource.RFP, EstimateSource.RFQ,
  EstimateSource.Referral, EstimateSource.Other,
];

const DELIVERABLE_TYPES: readonly DeliverableType[] = [
  DeliverableType.GMP, DeliverableType.ConceptualEst, DeliverableType.LumpSumProposal,
  DeliverableType.Schematic, DeliverableType.DDEst, DeliverableType.ROM,
  DeliverableType.HardBid,
];

const AWARD_STATUSES: readonly AwardStatus[] = [
  AwardStatus.Pending, AwardStatus.AwardedWithPrecon,
  AwardStatus.AwardedWithoutPrecon, AwardStatus.NotAwarded,
];

const PROJECT_TITLES = [
  'Palm Beach County - EOC Four Points Connector', 'Alton Hilltop (Kolter)',
  'Murray Middle School', 'Brightline Orlando Terminal', 'Sawgrass Mills Mixed-Use',
  'Martin County Fire Station #9', 'Related Wynwood Tower', 'PBAU Science Building',
  'Boca Raton Innovation Campus', 'Jupiter Medical Center', 'FIU Engineering Complex',
  'Port Everglades Terminal 32', 'Aventura Mall Expansion', 'Delray Beach City Hall',
  'Boynton Beach Town Square', 'Wellington Equestrian Center', 'Palm Beach Gardens Mall',
  'Stuart Waterfront Promenade', 'Coral Springs City Center', 'Pembroke Pines Civic Center',
];

const PX_NAMES = ['Mike Henderson', 'Jeff Collier', 'Tom Harris', 'Sarah Williams', 'David Martinez'];

/**
 * Generate `count` estimating tracker records with realistic field distribution.
 */
export function generateEstimatingTrackers(count: number, seed: number = 42): IEstimatingTracker[] {
  const rng = new SeededRandom(seed);
  const records: IEstimatingTracker[] = [];

  for (let i = 0; i < count; i++) {
    const titleIdx = i % PROJECT_TITLES.length;
    const estimator = rng.choice(ESTIMATOR_NAMES);
    const estimatorId = ESTIMATOR_NAMES.indexOf(estimator) + 1;
    const numContributors = rng.int(0, 3);
    const contributorNames = rng.sample([...ESTIMATOR_NAMES].filter(n => n !== estimator), numContributors);
    const pxIdx = rng.int(0, PX_NAMES.length - 1);
    const sqft = rng.int(5000, 500000);
    const costValue = rng.int(1000000, 800000000);

    records.push({
      id: i + 1,
      Title: `${PROJECT_TITLES[titleIdx]} ${i >= PROJECT_TITLES.length ? `Phase ${Math.floor(i / PROJECT_TITLES.length) + 1}` : ''}`.trim(),
      LeadID: rng.int(1, 50),
      ProjectCode: `25-${rng.int(1, 99).toString().padStart(3, '0')}-01`,
      Source: rng.choice(SOURCES),
      DeliverableType: rng.choice(DELIVERABLE_TYPES),
      SubBidsDue: randomDateOnly(rng, 2026, 2027),
      PreSubmissionReview: randomDateOnly(rng, 2026, 2027),
      WinStrategyMeeting: randomDateOnly(rng, 2026, 2027),
      DueDate_OutTheDoor: randomDateOnly(rng, 2026, 2027),
      LeadEstimator: estimator,
      LeadEstimatorId: estimatorId,
      Contributors: contributorNames,
      ContributorIds: contributorNames.map(n => ESTIMATOR_NAMES.indexOf(n as typeof ESTIMATOR_NAMES[number]) + 1),
      PX_ProjectExecutive: PX_NAMES[pxIdx],
      PX_ProjectExecutiveId: pxIdx + 10,
      Chk_BidBond: rng.bool(0.7),
      Chk_PPBond: rng.bool(0.5),
      Chk_Schedule: rng.bool(0.75),
      Chk_Logistics: rng.bool(0.4),
      Chk_BIMProposal: rng.bool(0.5),
      Chk_PreconProposal: rng.bool(0.35),
      Chk_ProposalTabs: rng.bool(0.3),
      Chk_CoordMarketing: rng.bool(0.25),
      Chk_BusinessTerms: rng.bool(0.65),
      EstimateType: rng.choice(DELIVERABLE_TYPES),
      EstimatedCostValue: costValue,
      CostPerGSF: sqft > 0 ? Math.round(costValue / sqft) : undefined,
      SubmittedDate: rng.bool(0.4) ? randomDateOnly(rng, 2026, 2027) : undefined,
      AwardStatus: rng.choice(AWARD_STATUSES),
      NotesFeedback: rng.bool(0.6) ? `${rng.choice(CLIENT_NAMES)} — ${rng.choice(['Competitive pursuit', 'Repeat client', 'Design-build', 'Public RFP', 'Negotiated GMP'])}` : undefined,
    });
  }

  return records;
}
