# Estimating-to-Operations Turnover Meeting Guide

> **Stage 19** | Source: `src/webparts/hbcProjectControls/components/pages/project-hub/PHProjectTurnoverPage.tsx`
> SOP Reference: `reference/EstTurnover/Turnover Agenda.docx`

---

## Overview & Purpose

The Turnover Meeting page implements the HBC **Estimating and Project Manager Turnover Meeting Procedure** SOP. Its purpose is to ensure a smooth and efficient transition of a construction project from the estimating phase to the project management and field operations team. The meeting facilitates the transfer of vital project information, setting the stage for successful project execution.

The page provides a digital turnover package with 18 SOP-mandated sections, collaborative editing for live meetings, conference-room Presentation Mode, threaded discussion, digital sign-off, and automatic project handoff to Operations.

---

## Accessing the Turnover Page

### From Estimating Department Tracking

1. Navigate to **Preconstruction > Department Tracking**.
2. Find the project row in the estimating tracker table.
3. Click the **action menu** (three-dot icon) on the project row.
4. Select **Turnover** from the context menu.

**Note:** The Turnover menu item is only enabled when the project's Award Status is **"Awarded w/ Precon"** or **"Awarded w/o Precon"**. Projects in other statuses (e.g., Pursuing, Lost) will have the Turnover option disabled.

### Direct URL

Navigate to `/project-hub/precon/turnover?projectCode=<CODE>`. If no turnover agenda exists, you will see a guidance message directing you to navigate from the Department Tracking page instead (the `leadId` search parameter is required for automatic agenda initialization).

### Route

```
/project-hub/precon/turnover?projectCode=<CODE>&leadId=<ID>
```

---

## Page Modes

### Packet Mode (Default)

The page opens in **read-only packet mode** — a printable meeting packet showing all 18 SOP sections with their current data. All users can view the packet regardless of role. Discussion threads are always active in this mode (users can post comments and notes).

### Edit Mode

Click the **Edit** button in the toolbar to enter collaborative editing mode. Edit mode is **role-gated** to the following roles:

- Administrator
- Leadership
- Estimator
- Preconstruction Manager
- Commercial Operations Manager
- Luxury Residential Manager
- Manager of Operational Excellence

In Edit Mode, you can:
- Check/uncheck prerequisite items
- Edit discussion item notes with rich text formatting
- Mark exhibits as reviewed
- Mark discussion items as discussed
- Sign the turnover package (if you are a designated signatory)

Click the **Start Turnover Meeting** button to immediately enter Edit Mode for a live meeting session.

### Presentation Mode

Click the **Presentation Mode** button (slide icon) in the toolbar for conference-room projection. This mode:

- Enters full-screen mode automatically
- Displays a **two-column layout**: 22% left sidebar (agenda navigation) + 78% right content area
- Supports **Document Picture-in-Picture** (PiP) for popping out the agenda sidebar to a separate window (useful for dual-screen setups)
- Falls back to `window.open` with BroadcastChannel sync if PiP is unavailable
- Click **Exit** (X icon) to return to normal mode

The floating Discussion panel remains accessible in Presentation Mode.

---

## 18 SOP Sections

The page follows the official Turnover Agenda document structure, organized under 5 headings:

### Project Overview
1. **Project Information** — Job Number, Project Name, Client, Value, Delivery Method, PE, PM, Lead Estimator
2. **Meeting Attendees** — Required (PE, PM, APM, Superintendent, Lead Estimator) and Optional attendees
3. **Pre-Meeting Prerequisites** — Checklist with completion tracking (plans review, site visit, agenda prep, document printing)
4. **Purpose** — SOP purpose statement (read-only)
5. **General Project Information** — Project description and discussion

### Turnover to Operations
6. **Turnover to Operations** — Drawings review, plan flip, specs, RFIs, addendums
7. **Project Estimate Overview** — Financial table (Contract Value, Original Estimate, Buyout Target, Fee, Gross Margin, Contingency) with optional notes

### Risk & Value Analysis
8. **Risk Identification & Mitigation** — Risk discussion with notes
9. **Potential Savings or Shortfalls** — VE options, SDI gaps, scope clarifications
10. **Critical Lead Times** — HVAC, switchgear, light fixtures, windows/storefronts

### Subcontractor Review
11. **Subcontractor Proposals & Bid Leveling** — Review sub proposals
12. **Potential Buyouts** — Trade-by-trade buyout discussion
13. **Scope Gaps** — CFCI/OFCI items, coordination gaps
14. **SDI Policy & Subcontractor Prequalification** — Policy review
15. **Preferred & Required Subcontractors** — DataGrid with Trade, Subcontractor, Contact, Email, Phone, Compass (Q-Score) columns

### Documents & Closeout
16. **Contract Document Exhibits** — Cost Summary, Clarifications, Alternates, Allowances, VA Log, Schedule, Site Logistics, Labor Rates, RFIs, Other — with reviewed/pending badges
17. **Post-Meeting Actions** — Publish Operations team contacts on Building Connected
18. **Summary & Sign-off** — Digital signature block with SOP affidavit

Use the **Prev/Next** buttons or the **View All Sections** button in the toolbar to navigate between sections. You can focus on a single section or view the entire packet at once.

---

## Floating Discussion Panel

The **Meeting Discussion** panel is a persistent floating bottom-sheet that stays visible while scrolling through the 18 SOP sections. It contains the **global** discussion thread for general meeting notes.

### Features
- **Always visible** — appears in both Packet Mode and Edit Mode, and in Presentation Mode
- **Collapsible** — click the navy header bar to collapse to a thin 48px bar; click again to expand
- **State persistence** — expanded/collapsed state is saved to localStorage and remembered across page loads
- **Message count badge** — orange pill badge shows the number of global discussion posts
- **Keyboard accessible** — Tab to the header, press Enter or Space to toggle

### Usage
1. Click the navy **"Meeting Discussion"** bar at the bottom of the screen to expand.
2. Type a note in the rich text editor. Use `@Estimator`, `@PM`, or `@Superintendent` for role mentions.
3. Press **Ctrl+Enter** (or Cmd+Enter on Mac) or click **Post** to submit.
4. Click the header bar again to collapse when you need more screen space.

---

## Rich Text Editing

All text input fields (discussion thread posts, discussion item notes, estimate overview notes) use a rich text editor with a formatting toolbar:

| Button | Action | Keyboard Shortcut |
|--------|--------|-------------------|
| **B** | Bold | Ctrl+B |
| *I* | Italic | Ctrl+I |
| U | Underline | Ctrl+U |
| Bullet list | Bulleted list | — |
| Number list | Numbered list | — |
| Link | Insert hyperlink | — |
| Attach | Attach file | — |

Notes are stored as HTML and rendered with proper formatting in read-only mode.

**File attachments:** The attachment button opens a file picker. File upload service integration is planned for Stage 20+.

---

## Per-Section Discussion Threads

Each discussion-backed SOP section (sections 5-14, 17) has its own **inline discussion thread** below the section content. These threads are:

- **Always active** — users can post in both Packet Mode and Edit Mode
- **Section-scoped** — notes are associated with the specific SOP section
- **Rich text** — same formatting toolbar as the global discussion
- **Keyboard accessible** — Ctrl+Enter to post

This allows meeting participants to leave section-specific notes, action items, and follow-up questions directly in context.

---

## Digital Sign-off & Handoff

### Sign-off Process

The **Summary & Sign-off** section (Section 18) implements the SOP's signature requirements:

1. The SOP affidavit is displayed: *"The undersigned hereby acknowledges having reviewed and accepted the foregoing items."*
2. Four required signatories are listed:
   - Lead Estimator
   - Project Executive
   - Project Manager
   - Superintendent
3. Each signatory sees an **"I Accept"** button that is enabled only when:
   - The page is in Edit Mode
   - The logged-in user's Entra ID email matches the signatory's email
4. Clicking "I Accept" records the digital signature with a timestamp.

### Automatic Handoff

When **all four signatures** are collected, the system automatically:

1. Triggers the `handoffProjectFromEstimating()` mutation with a payload containing:
   - Financial roll-up (Contract Value, Estimate, Buyout Target, Fee, Margin, Contingency)
   - Team assignments (PE, PM, Lead Estimator)
   - All signature records with dates
2. Generates a **PDF export** of the complete turnover packet
3. Displays a **"Turnover Complete"** success screen
4. Provides a button to navigate to the **Project Hub Dashboard** with a handoff notification toast

---

## Initializing a New Turnover Agenda

### Automatic Initialization (Recommended)

When you navigate to the Turnover page from the Department Tracking context menu and no agenda exists yet:

1. The system automatically calls `createTurnoverAgenda(projectCode, leadId)`.
2. A progress bar is displayed: *"Setting up the 18-section SOP template..."*
3. The agenda is seeded with default prerequisites, discussion items, exhibits, and signature slots.
4. Estimate overview fields are auto-populated from the lead data.
5. The page opens in Edit Mode so you can begin populating the turnover package.

### Manual Navigation (Fallback)

If you navigate directly to the turnover URL without a `leadId` parameter:

- A guidance message is shown: *"Navigate from the Estimating Department Tracking page to initialize this turnover agenda."*
- The lead reference is required to seed project data into the agenda template.

---

## Troubleshooting

### "No Project Selected"

**Cause:** Navigated to the turnover page without a `projectCode` search parameter and no project is selected in the app context.

**Fix:** Navigate from the Department Tracking page using the context menu, or ensure a project is selected in the sidebar.

### Turnover Menu Item is Disabled

**Cause:** The project's Award Status is not "Awarded w/ Precon" or "Awarded w/o Precon".

**Fix:** The project must be in an awarded status before a turnover meeting can be initiated. Update the Award Status in the estimating tracker.

### "Navigate from the Estimating Department Tracking page"

**Cause:** Navigated directly to `/project-hub/precon/turnover?projectCode=...` without the `leadId` parameter.

**Fix:** Use the context menu in Department Tracking. The `leadId` is required to seed the agenda template with lead data.

### Discussion Panel Not Visible

**Cause:** The floating panel may be collapsed to a thin bar at the bottom of the screen.

**Fix:** Look for the navy "Meeting Discussion" bar at the bottom of the viewport and click it to expand.

### Edit Button Not Visible

**Cause:** Your role is not in the allowed list for turnover editing.

**Fix:** The Edit and Start Meeting buttons are visible only to users with Administrator, Leadership, Estimator, Preconstruction Manager, or Operations Manager roles. Contact your administrator if you need edit access.

### "I Accept" Button Disabled

**Cause:** Either the page is not in Edit Mode, or your Entra ID email does not match the designated signatory.

**Fix:** Enter Edit Mode first, then verify you are logged in with the email address assigned to your signature slot.

---

## Future Automation (Stage 20+ TODOs)

The following enhancements are documented as TODO comments in the source code for future stages:

- **Auto-populate from existing records** — Seed agenda sections from Go/No-Go scorecard, estimating kickoff, bid log, and subcontractor prequalification data
- **File attachment upload service** — Wire the attachment buttons to a SharePoint document library upload service
- **@mention parsing and highlighting** — Parse `@Role` mentions and render them as styled badges with notification hooks
- **Emoji reactions** — Add reaction buttons to thread posts
- **Real-time typing indicators** — Show "User is typing..." indicators in discussion threads
- **Offline-first export queue** — IndexedDB fallback for field estimators on spotty Wi-Fi
- **"Mark as Awarded" action** — Trigger handoff mutation and deep-link from Department Tracking

---

## Version History

See [CHANGELOG.md](../CHANGELOG.md) for detailed version history. Stage 19 entries:

| Sub-task | Description | Date |
|----------|-------------|------|
| Pre-task 2 | Turnover & Project Hub cross-workspace navigation fixes | 2026-02-28 |
| Sub-task 1 | PHProjectTurnoverPage: 18 SOP sections, hybrid mode, Presentation Mode, sign-off | 2026-02-28 |
| Sub-task 2 | On-demand turnover agenda initialization | 2026-02-28 |
| Sub-task 3 | Rich text editing for turnover meeting fields | 2026-02-28 |
| Sub-task 4 | Floating collapsible Discussion panel | 2026-02-28 |
