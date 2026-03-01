# Go/No-Go Scorecard Specification

**Document ID**: HBC-PC-GNG-001  
**Version**: 1.1 (aligned with Excel Version 1.1 – Updated Estimated Project $ scale and Self-Perform scoring)  
**Status**: Authoritative single source of truth  
**Last Updated**: 2026-03-01  
**Governing Instruction**: All development of `GoNoGoPage.tsx`, `@hbc/sp-services` Go/No-Go hooks, and any related components MUST retrieve this document first via MCP (`find_relevant_context`) before any implementation. No hard-coded values, labels, points, or logic allowed outside this spec.

## 1. Project Header Information (Auto-populated where possible)

Fields sourced from the Opportunity / Project entity (via TanStack Query from `@hbc/sp-services`):

- Date of Evaluation (Date)
- Originator (Person – defaults to current user)
- Department of Lead Origination (Choice: Business Development, Estimating, etc.)
- Project Name
- Client Name
- A/E
- City Location
- Region (Choice: West Palm, Orlando, Melbourne, S Florida, etc.)
- Sector
- Sub Sector
- Proposal/Bid Due
- Award Date
- Project Value (Currency)
- Delivery Method (Choice)
- Project Start Date
- Project Duration in Months
- Preconstruction Duration in Months
- Anticipated Fee %
- Anticipated Gross Margin
- Estimated Pursuit Cost
- Estimated Precon Budget
- Square Feet

## 2. Core Scoring Criteria (Exactly 19 – fixed order)

Both Originator (BD Lead) and GNG Committee score each criterion independently using a dropdown (Low / Average / High). Points and definitions are immutable.

| # | Criteria                                      | High (Points & Definition)                                      | Average (Points & Definition)                              | Low (Points & Definition)                                      |
|---|-----------------------------------------------|-----------------------------------------------------------------|------------------------------------------------------------|----------------------------------------------------------------|
| 1 | Client Importance                             | **6** – Very Important                                          | **4** – Important                                          | **2** – Less Important                                         |
| 2 | Competition (short list)                      | **4** – 1-3 or weak                                             | **2** – 4-6 or average                                     | **0** – 7+ or strong                                           |
| 3 | Estimated Project $                           | **4** – $50M+                                                   | **2** – $10M–$49M                                          | **1** – Less than $10M                                         |
| 4 | Location/Environment                          | **5** – Local, favorable (no perdiems on staff, commute)       | **3** – Close, Average                                     | **1** – Distant, Severe                                        |
| 5 | Commercially Viable                           | **6** – Highest Probability to Break Ground                     | **4** – Average Risk                                       | **2** – High risk to start                                     |
| 6 | Preferred by the Decision Maker               | **6** – Yes                                                     | **3** – Neutral                                            | **0** – No or decision maker prefers other                     |
| 7 | A & E Experience                              | **5** – Successful previous experience                          | **4** – Mediocre previous experience                       | **1** – None or poor previous experience                       |
| 8 | Staff Availability                            | **4** – On Bench                                                | **2** – Available                                          | **1** – Must Hire                                              |
| 9 | Staff Experience In Project Type              | **5** – Extensive                                               | **3** – Average                                            | **0** – None                                                   |
|10 | Staff Experience in Geography                 | **5** – Extensive                                               | **3** – Some                                               | **0** – None                                                   |
|11 | Schedule                                      | **3** – Liberal                                                 | **2** – Manageable                                         | **1** – Difficult                                              |
|12 | Contract Terms/Conditions                     | **4** – Favorable                                               | **3** – Average                                            | **0** – Poor or Unknown                                        |
|13 | Type of Contract                              | **5** – Sole Source Neg.                                        | **4** – GMP/CM at Risk                                     | **1** – Bid                                                    |
|14 | Client Financing                              | **5** – Secure                                                  | **3** – Available                                          | **1** – Unknown                                                |
|15 | Supports sector diversification               | **7** – COE Sector                                              | **5** – Diverse Sector                                     | **2** – Neither                                                |
|16 | Investment Front End/Time Budgeting, Estimating, Mktg. | **5** – Small                                              | **2** – Average                                            | **1** – Significant                                            |
|17 | Profit Potential                              | **5** – > 4.5%                                                  | **3** – 4–4.5%                                             | **2** – < 4%                                                   |
|18 | Fee Enhancement (Subguard, Billable Rates, Savings Split or all) | **5** – All                                       | **3** – 2 out of 3                                         | **2** – 1 out of 3                                             |
|19 | Self Perform Potential                        | **3** – 2 or more scopes                                        | **2** – One scope                                          | **1** – None                                                   |

**Maximum Possible Scores** (for reference only – calculated dynamically):
- All High selections: **100 points**
- All Average selections: **60 points**
- All Low selections: **20 points**

## 3. Calculation Rules (must be implemented exactly)

```ts
// Pseudo-code – must match this logic in GoNoGoPage.tsx and services
const originatorTotal = sum of all 19 Originator points;
const committeeTotal = sum of all 19 Committee points;
const difference = committeeTotal - originatorTotal;

const getScoreColor = (score: number) => {
  if (score >= 75) return "green";     // Focus All Efforts
  if (score >= 60) return "amber";     // Pursue / Prioritize
  return "red";                        // Drop
};