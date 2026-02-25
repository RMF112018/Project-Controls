import type { ILead } from '../../models/ILead';
import {
  Stage, Region, Division, DepartmentOfOrigin, DeliveryMethod,
  GoNoGoDecision, WinLossDecision, LossReason, Sector,
} from '../../models/enums';
import {
  SeededRandom,
  randomDateOnly,
  USER_EMAILS,
  AE_FIRMS,
  CLIENT_NAMES,
} from './helpers';

const STAGES: readonly Stage[] = [
  Stage.LeadDiscovery, Stage.GoNoGoPending, Stage.Opportunity,
  Stage.Pursuit, Stage.WonContractPending, Stage.ActiveConstruction,
  Stage.Closeout, Stage.ArchivedNoGo, Stage.ArchivedLoss,
];

const STAGE_WEIGHTS: readonly number[] = [25, 15, 15, 15, 8, 8, 4, 5, 5];

const REGIONS: readonly Region[] = [
  Region.Miami, Region.WestPalmBeach, Region.MartinCounty, Region.Orlando,
];

const SECTORS: readonly Sector[] = [
  Sector.Commercial, Sector.Municipal, Sector.MixedUse, Sector.MultiFamily,
  Sector.State, Sector.County,
];

const DELIVERY_METHODS: readonly DeliveryMethod[] = [
  DeliveryMethod.GMP, DeliveryMethod.HardBid, DeliveryMethod.PreconWithGMP, DeliveryMethod.Other,
];

const CITIES: Record<Region, readonly string[]> = {
  [Region.Miami]: ['Miami', 'Miami Beach', 'Coral Gables', 'Aventura', 'Sunny Isles', 'Doral'],
  [Region.WestPalmBeach]: ['West Palm Beach', 'Boca Raton', 'Delray Beach', 'Jupiter', 'Palm Beach Gardens'],
  [Region.MartinCounty]: ['Stuart', 'Jensen Beach', 'Palm City', 'Hobe Sound'],
  [Region.Orlando]: ['Orlando', 'Kissimmee', 'Winter Park', 'Lake Nona'],
  [Region.Tallahassee]: ['Tallahassee', 'Thomasville'],
};

function pickWeightedStage(rng: SeededRandom): Stage {
  const totalWeight = STAGE_WEIGHTS.reduce((a, b) => a + b, 0);
  let roll = rng.float(0, totalWeight);
  for (let i = 0; i < STAGES.length; i++) {
    roll -= STAGE_WEIGHTS[i];
    if (roll <= 0) return STAGES[i];
  }
  return STAGES[0];
}

/**
 * Generate `count` leads with realistic pipeline distribution.
 * ~40% will have Go/No-Go history.
 */
export function generateLeads(count: number, seed: number = 42): ILead[] {
  const rng = new SeededRandom(seed);
  const leads: ILead[] = [];

  for (let i = 0; i < count; i++) {
    const stage = pickWeightedStage(rng);
    const region = rng.choice(REGIONS);
    const city = rng.choice(CITIES[region] || ['Unknown']);
    const sector = rng.choice(SECTORS);
    const sqft = rng.int(5000, 500000);
    const projectValue = rng.int(500000, 400000000);
    const division = rng.bool(0.75) ? Division.Commercial : Division.LuxuryResidential;

    const lead: ILead = {
      id: i + 1,
      Title: `${rng.choice(CLIENT_NAMES)} - ${city} ${rng.choice(['Tower', 'Campus', 'Center', 'Complex', 'Building', 'Station', 'Renovation', 'Addition'])} ${i > CLIENT_NAMES.length * 2 ? `Phase ${Math.floor(i / (CLIENT_NAMES.length * 2)) + 1}` : ''}`.trim(),
      ClientName: rng.choice(CLIENT_NAMES),
      AE: rng.choice(AE_FIRMS),
      CityLocation: city,
      AddressCity: city,
      AddressState: 'FL',
      AddressStreet: `${rng.int(100, 9999)} ${rng.choice(['Main St', 'Ocean Blvd', 'Federal Hwy', 'Palmetto Park Rd', 'Flagler Dr'])}`,
      AddressZip: `3${rng.int(3000, 4999)}`,
      Region: region,
      Sector: sector,
      Division: division,
      Originator: rng.choice(USER_EMAILS),
      DepartmentOfOrigin: rng.choice([
        DepartmentOfOrigin.BusinessDevelopment,
        DepartmentOfOrigin.Estimating,
        DepartmentOfOrigin.Marketing,
      ]),
      DateOfEvaluation: randomDateOnly(rng, 2025, 2026),
      DateSubmitted: randomDateOnly(rng, 2025, 2026),
      SquareFeet: sqft,
      ProjectValue: projectValue,
      DeliveryMethod: rng.choice(DELIVERY_METHODS),
      Stage: stage,
      EstimatedPursuitCost: rng.int(5000, 200000),
      AnticipatedFeePct: rng.float(2, 8),
      AnticipatedGrossMargin: rng.float(3, 12),
    };

    // Go/No-Go data for stages past discovery
    const hasGoNoGo = ![Stage.LeadDiscovery].includes(stage);
    if (hasGoNoGo) {
      lead.GoNoGoScore_Originator = rng.int(30, 92);
      lead.GoNoGoScore_Committee = rng.int(30, 92);
      lead.GoNoGoDecisionDate = randomDateOnly(rng, 2025, 2026);

      if ([Stage.ArchivedNoGo].includes(stage)) {
        lead.GoNoGoDecision = GoNoGoDecision.NoGo;
      } else if (rng.bool(0.15)) {
        lead.GoNoGoDecision = GoNoGoDecision.ConditionalGo;
      } else {
        lead.GoNoGoDecision = GoNoGoDecision.Go;
      }
    }

    // Win/Loss for archived-loss and won stages
    if ([Stage.ArchivedLoss].includes(stage)) {
      lead.WinLossDecision = WinLossDecision.Loss;
      lead.WinLossDate = randomDateOnly(rng, 2025, 2026);
      lead.LossReason = rng.sample(
        [LossReason.Price, LossReason.Relationship, LossReason.Experience, LossReason.Schedule, LossReason.Competition],
        rng.int(1, 3),
      );
      lead.LossCompetitor = rng.choice(['Moss Construction', 'Balfour Beatty', 'Brasfield & Gorrie', 'Turner Construction']);
    }

    if ([Stage.WonContractPending, Stage.ActiveConstruction, Stage.Closeout].includes(stage)) {
      lead.WinLossDecision = WinLossDecision.Win;
      lead.WinLossDate = randomDateOnly(rng, 2025, 2026);
      lead.ProjectCode = `25-${rng.int(1, 99).toString().padStart(3, '0')}-01`;
      lead.OfficialJobNumber = `HBC-${rng.int(1000, 9999)}`;
    }

    // Project executive & manager for pursued/won stages
    if (![Stage.LeadDiscovery, Stage.ArchivedNoGo, Stage.ArchivedLoss].includes(stage)) {
      lead.ProjectExecutive = rng.choice(['Mike Henderson', 'Jeff Collier', 'Tom Harris']);
      lead.ProjectManager = rng.choice(['John Smith', 'Maria Garcia', 'James Wilson', 'Lisa Chen']);
    }

    leads.push(lead);
  }

  return leads;
}
