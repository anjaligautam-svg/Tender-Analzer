# TenderAI Procurement Portal — Session Handoff

> **Drop this whole file into the first message of a new Claude conversation
> and you'll have the full context of the work to date.** Also read
> [`Tender.md`](Tender.md) for the original project brief — this file
> extends it with everything that's changed in the recent build sessions.

---

## 1. Where the code lives

```
/Users/Anjali/Documents/GitHub/Tender-Analzer/
```

**git branch:** `main`
**remote:** `github.com/anjaligautam-svg/Tender-Analzer.git` (HTTPS, no creds configured — `git push` will fail until SSH/PAT/`gh` is set up)

⚠️ A stale older copy lives at `/Users/Anjali/tenderai-prebid/` — **never edit it**. Only work in `Tender-Analzer/`.

⚠️ The workspace's `cwd` is the macOS home directory `/Users/Anjali` (it has its own `git init`). Avoid `git add -A` / `git add .` from there — it would stage your entire `$HOME` including dotfiles.

---

## 2. Stack & build

- **Plain static HTML/JS — no framework, no bundler, no build step.**
- Each page is one self-contained `.html` file: `<style>` block + one `<script>` block at the bottom.
- **Tailwind via CDN** (`cdn.tailwindcss.com`) plus an inline `tailwind.config` block in every file.
- **DM Sans** font (Google Fonts, all weights 400/500/600/700).
- **Lucide icons** via UMD CDN. Call `refreshIcons()` after any DOM mutation that adds icons.
- **localStorage** for all per-tender working state. **sessionStorage** for login + UI panel-open state.

### Running locally

The repo has a `.claude/launch.json` entry called `tender-analyzer` that points the Claude Preview MCP at port 4180. **It doesn't work** — the Claude.app sandbox can't read the project directory, so every request 404s. Use a plain Bash background server instead:

```bash
cd /Users/Anjali/Documents/GitHub/Tender-Analzer
python3 -m http.server 4180
```

Then open `http://localhost:4180/` in your own browser (not the Claude in-app preview pane).

When a server is already running on 4180, find + kill it:

```bash
lsof -i :4180 | grep LISTEN
kill <PID>
```

### One-shot Stage-4 design preview

`_preview-stage4.html` (untracked, kept locally) seeds `bidmgmt_TND-2026-001` with Stage 4 state and redirects to bid-management. Open it for a quick demo of Award Recommendation + LoA form together.

---

## 3. File map

| File | What it is | Status |
|---|---|---|
| `index.html` | Procurement dashboard landing | Pre-existing |
| `login.html` / `login-v2.html` | Sign-in pages | Pre-existing |
| `dpr-creation.html` | DPR creation flow | Pre-existing |
| `tender-creation.html` | 7-step tender creation wizard | Pre-existing |
| `prebid-queries.html` | Pre-bid queries module | Pre-existing |
| **`evaluation.html`** | **Bid Evaluation — heavily extended** | See §5 |
| **`comparative-statement.html`** | **Bid Comparison — full rebuild** | See §6 |
| **`bid-management.html`** | **Bid Management — full rebuild** | See §7 |
| `Tender.md` | Original project brief | Older but still useful |
| `HANDOFF.md` | **This file** | — |
| `_preview-stage4.html` | Local-only Stage-4 demo helper (untracked) | — |

The three bolded files are the focus of recent work. Other pages haven't been touched in this session.

---

## 4. Cross-cutting conventions you must follow

### 4.1 Design tokens

```
Primary  #0F5EE8   Primary-light  #EFF6FF
Success  #10B981   Success-light  #F0FDF4
Warning  #F59E0B   Warning-light  #FFFBEB
Danger   #EF4444   Danger-light   #FEF2F2
Purple   #8B5CF6   Purple-light   #EEEDFE
Text     #111827 / #6B7280 / #9CA3AF
Border   #E5E7EB     Surface     #F9FAFB
Radius   8 inputs · 12 cards · 16 large
Font     DM Sans
Transitions  150ms hover · 200ms expand · 250-300ms reveals
```

Don't introduce new tokens. Use the existing ones.

### 4.2 In-flow overlays (CRITICAL — `position: fixed` breaks the preview iframe)

All panels, modals, popovers, dialogs use `position: absolute` within a `position: relative` parent — **never `position: fixed`**. Standard pattern:

```html
<div class="flex-1 flex flex-col min-w-0 main-col">  <!-- main-col has position:relative -->
  <header ...></header>
  <main class="overflow-y-auto">...</main>

  <!-- Overlays as siblings of <main>, inside main-col -->
  <div class="modal-backdrop" onclick="closeModal()"></div>
  <aside class="slide-panel" role="dialog" aria-modal="true">...</aside>
</div>
```

```css
.main-col { position: relative; }
.modal-backdrop { position: absolute; top: 64px; left: 0; right: 0; bottom: 0; ... }
.slide-panel { position: absolute; top: 64px; right: 0; bottom: 0; width: 720px;
               transform: translateX(100%); transition: transform 280ms; }
.slide-panel.open { transform: translateX(0); }
```

`top: 64px` clears the sticky header. The sidebar stays untouched because it lives outside `.main-col`.

### 4.3 Indian number formatting

Always `n.toLocaleString('en-IN')`. Never plain `toLocaleString()`. `₹26,40,000` not `₹2,640,000`.

### 4.4 Per-page state in localStorage

Each page has its own key namespace:

| Page | localStorage key | Top-level shape |
|---|---|---|
| Evaluation | `eval_<TND-ID>` | `EVAL` object — see §5.6 |
| Bid Comparison | `comparison_<TND-ID>` | `COMP` object — see §6.4 |
| Bid Management | `bidmgmt_<TND-ID>` | `BM` object — see §7.5 |

Plus the `_seedV` integer on each state object — bump when shape changes; the matching openWorkspace check discards old states and re-seeds.

### 4.5 The "demo tender" is `TND-2026-001`

Every page treats TND-2026-001 specially via `seedDemo(tnd)` — a fully-pre-populated state so screens are immediately viewable. Pre-seed any new feature here so the first-time experience shows it off.

### 4.6 Icons

Lucide only (not Tabler — the spec sometimes says `ti-*`; map to lucide):

- `ti-search` → `search`
- `ti-upload` → `upload-cloud`
- `ti-file-description` → `file-text`
- `ti-external-link` → `external-link`

Call `refreshIcons()` after any innerHTML mutation that includes `<i data-lucide="...">`.

### 4.7 Audit logging convention (evaluation only)

`log(section, action, detail)` is defined in `evaluation.html` and pushes to `EVAL.auditLog`. Call it from every state-changing user action. Categories that get coloured left borders in the panel are determined by `actionCategory()` regex matching.

---

## 5. `evaluation.html` — Bid Evaluation

Heaviest file in the repo (~7000 lines including the inline script). Stages currently split into 4 numbered sections inside the Technical Evaluation tab plus the Financial Evaluation tab.

### 5.1 Page-level structure

- **Screen 1 — Landing**: 24px title + subtitle, full-width search with real-time fade-filter (opacity 0.3 on non-matching rows), "READY FOR EVALUATION" active list, collapsible "AWARDED — CLOSED" section, "Upload Tender" button that opens an inline drop-zone with AI-extracted fields.
- **Screen 2 — Workspace**: breadcrumb, tender context bar, **Audit Log trigger button + slide-down panel** (recent), two stage tabs (Technical / Financial), section cards.

### 5.2 Technical Evaluation tab (`stage-technical`)

Four numbered sections rendered as `finCard`-style accordions:

- **Section 01 — Upload Technical Bids**: white-card "Add a Bid" form on top (vendor combo with "+ Add new vendor" inline flow, taller drop-zone with simulated 1.5s upload progress, read-only "Technical Bid" pill, full-width disabled-until-valid submit). "Opened Bids" table below with "View Technical Bid" link that opens the 720px right-side document panel (`techBidDocHTML`).
- **Section 02 — PQ Evaluation**: vendor-selector pill tabs + "View Bid" CTA (right) + per-vendor criteria table with columns **Criterion / Requirement / Submitted Value / Evidence / Verdict**. NOTES column was removed. **Evidence column** opens a 680px right-side document panel with realistic Indian-government templates (MCA Cert of Incorporation, blue-card PAN, GST, CA Turnover Cert, ISO 9001:2015, Non-Blacklisting, MITC Work Order). **Verdict column** opens a 4-card popover (Pass / Fail / Pending / Clarification Required) with an inline clarification form when "Clarification" is picked.
- **Section 03 — TQ Evaluation**: same vendor tabs + "View Bid" + collapsible **Vendor Presentations sub-section** (per-vendor PPT/PDF upload, video file or YouTube/Drive URL, "Include in TQ scoring" toggle with marks input, notes). Below that, the **3-member committee scoring table** (Member 1 = Rajesh Kumar = logged-in user, Member 2 Priya Shah, Member 3 Amit Patil). Logged-in user's column has score inputs; others show "Pending · Remind" or their submitted score. AVERAGE auto-computed live with `(N/3)` badge. VERDICT cell shows final allocated marks (tier-mapped for WO/ISO, rounded average for others). "Submit my scores for <vendor>" CTA + "Confirm TQ Evaluation" gate (needs all 3 × all-vendors).
- **Section 04 — Results & Actions**: Final TQ/NTQ results table at top (Vendor / Company Type / PQ Result / TQ Score / Final Verdict / Next Step) reading live from `EVAL.bids` + `matrix` + `PARSED_TECH`. Stat summary strip + collapsible "What do TQ and NTQ mean?" definition callout. Below: the existing clarification / NTQ-justification / TQ-ready sub-tables.

### 5.3 Financial Evaluation tab (`stage-financial`)

- **F1 — Upload Financial Bids**: white-card form mirroring S01 (vendor dropdown shows TQ-only + grayed NTQ, same dashed drop-zone, simulated upload, full-width submit). Opened bids table with **"View Financial Bid"** action that reuses `openBidDoc(vendor, 'fin')` — the same 720px panel as technical bids, different template (`finBidDocHTML` — cover, covering letter, 12-row BOQ with Subtotal/GST/Grand Total, declaration, signed footer).
- **F2 — Financial Evaluation**:
  - **Dynamic method banner** driven by `METHOD_META[m]` (L1/QCBS/LCS/QBS/FBS). Below it: a tender-reference note (`"This evaluation method (L1) was specified in the original tender document (TND-…, Step 1 — Classification)"`), or amber preview-mode note when active method ≠ native.
  - **5-pill segmented selector** with a **"Specified" badge** inside the native method's tab.
  - View body per method renders into the same container; switching animates opacity 0 → 1 over ~200ms. State persisted as `EVAL.evaluationMethod`.
  - Per-method inline toolbar inputs: **LCS** cutoff (default 75 / 100), **FBS** budget (₹ prefix, default = estimate), **QCBS** weightage (T/F auto-linked, sum-to-100 validation, purple Recalculate button + winner-change toast when rank-1 vendor flips).
  - **Winner-first reveal**: all quoted amounts + vsEstimate cells start masked as `••••••` pills. Blue banner + centered **"Reveal winner"** button above table. Confirm dialog → rank-1 row animates in (green left border, "Winner ✓" pill, 400ms blur→sharp on the quote). Non-winner rows have eye-icon buttons → click 1: amber "Click again to reveal" for 2s → click 2: that vendor's quote reveals. State persisted per-vendor in `EVAL.finRevealed`.
  - Inline **ALB decision block** (existing) for vendors quoting >15% below estimate. Accept-with-enhanced-security / Reject cards + a risk-warning strip.
- **F3 — Reasonableness Check**: Comparison summary card (EC / TS / recommended quote / variances) + auto-determined case banner (A reasonable / B above TS / C above EC by >10% / D ALB). Decision cards per case. QBS skips entirely. The old F2 "Send to Bid Comparison" button is gone — **F3 now owns the Proceed CTA** gated on reasonableness confirmation. Persisted in `EVAL.reasonableness`.

### 5.4 Audit log (cross-cutting)

- `EVAL.auditLog` is an append-only array. Each entry: `{id, timestamp, user, userRole, section, action, detail, ipNote}`.
- `log(section, action, detail)` helper sprinkled across handlers: bid uploads (S01 + F1), parsed-data edits, PQ verdict saves + changes, evidence views, clarification create/sent/received, PQ + TQ confirm, committee score entry/edit/submit, presentation upload/view/include, video views, method switches, winner + individual bid reveals, export.
- **Audit Log button** top-right of workspace (clipboard-list icon + today-count badge, `aria-live=polite`). Toggles a slide-down panel above the stage tabs.
- Panel: title + entry count + filter dropdown (All / PQ / TQ / Financial / Results / Today) + Export log (toast) + Collapse. Newest-first scrollable list (`max-height: 320px`). Each row coloured by `actionCategory()` — blue=view, green=create, amber=edit, purple=reveal, primary=send/submit.
- Open/closed state persisted in `sessionStorage.auditPanelOpen`.

### 5.5 PQ Verdict Popover gotcha (just fixed)

`openPqPopover(e, vendor, critId)` sets `pop.onclick = ev => ev.stopPropagation()` to prevent the document-level outside-click handler from closing the popover when a radio card is clicked (because `pickPqSel` replaces `pop.innerHTML`, detaching the originally-clicked node before the click bubbles to document, making `pop.contains(e.target)` false). **Don't remove the stopPropagation.**

### 5.6 `EVAL` state schema (current `_seedV: 6`)

```js
{
  tnd, stageTab, bids[], expanded,
  activeVendor,         // shared between PQ + TQ vendor tabs
  matrix: {},           // matrix[vendor][critId] = 'pass'|'fail'|'pending'|'clarif' (PQ) or number (TQ)
  notes: {},            // notes[`${vendor}|${critId}`] = string
  prescreened, pqConfirmed, tqConfirmed, t3confirmed,
  clarifications: [],   // array of {id, vendorId, criterionId, section:'PQ'|'TQ', text, deadline,
                        //          recipients:[{name,designation,contact}], status:'draft'|'sent'|'received',
                        //          sentAt, receivedAt}
  ntq: {},
  techComplete, readonly,
  finBids: [], finRun, finComplete, finExpanded, finOpeningRegister, finQuoteEdits,
  method,               // tender's declared method (from upload form)
  evaluationMethod,     // ACTIVE method (null = derive from .method)
  technicalWeightage, financialWeightage,
  lcsCutoff: 75, fbsBudget: null, ts: null,
  albDecision, albNote,
  reasonableness: { decision, note, retenderReason, confirmed },
  // Committee scoring (Change 2)
  tqMemberScores: {},      // {vendor: {critId: {rk:5, ps:5, ap:null}}}
  tqMemberSubmitted: {},   // {vendor: {rk:true, ps:false, ap:false}}
  // Presentations (Change 3)
  presentations: {},       // {vendor: {ppt, pptName, video, videoUrl, includeInTq, marks, notes}}
  presOpen: false,
  // Reveal (Change 4)
  finRevealed: {},         // {vendor: true}
  // Audit (Change 5)
  auditLog: [],
  _seedV: 6,
}
```

Constants in the file:

- `COMMITTEE_MEMBERS` — `[{id:'rk',name:'Rajesh Kumar',isYou:true}, {id:'ps',...}, {id:'ap',...}]`
- `METHOD_META` — `{L1:{name,icon,bg,border,text,sub,desc,mostCommon}, QCBS:{…}, LCS:{…}, QBS:{…}, FBS:{…}}`
- `PQ_CRITERIA` / `TQ_CRITERIA` — criterion definitions with `id`, `short`, `full`, `max` (TQ only)
- `VENDOR_OPTIONS` — 5 demo vendors
- `PARSED_TECH` / `PARSED_FIN` — per-vendor parsed-bid data used by the document viewers + the AI-extract-from-bid logic
- `QUOTE_NUM`, `ESTIMATE` — financial defaults
- `EVAL_TENDERS` — list of tenders shown on Bid Evaluation landing
- `AWARDED_TENDERS` — 3 sample "Selection made" rows for the AWARDED collapsed section

---

## 6. `comparative-statement.html` — Bid Comparison

### 6.1 Page-level structure

- **Screen 1 — Landing**: 24px title, full-width search with real-time fade-filter, READY FOR COMPARISON list (3 sample rows), collapsed COMPLETED section.
- **Screen 2 — Workspace**: breadcrumb, tender context bar with selection-status pill + Lock Comparison button.

### 6.2 Main comparison table (the centrepiece)

- Two-level header: group bands (**Vendor Info / Technical / Financial / Comparison / Decision**) with distinct tints, then column headers below.
- **13 columns** driven by the `COLUMNS` array. Sortable headers use `aria-sort` + arrow-up/arrow-down icons. table-layout: fixed.
- **Method-aware** — `methodColumns[activeMethod]` config decides which columns are visible (L1/QCBS/LCS/QBS/FBS each have a different visible-set), which columns render N/A (`naColumns`), and what the default sort + ranking label is.
- **Method pill + dropdown** at the left of the toolbar. Switching methods triggers a fade-and-reset (opacity 0.4 → re-render → opacity 1). Native method tagged "NATIVE" in the dropdown; amber preview-note when active ≠ native.
- Per-method inline inputs: **LCS** cutoff, **FBS** budget, **QCBS** weightage (with the same winner-change toast as evaluation).
- **Ranking label row** between header and first row (`aria-live`): "✦ Ranked by: …"
- **LCS** and **FBS** show a yellow divider row separating above-cutoff/within-budget from below-cutoff/above-budget zones.
- Rank-1 row: green left-border + light tint. NTQ rows: red border + 55% opacity + always at the bottom regardless of sort. Below-cutoff/above-budget: amber border + 0.45 opacity. Selected row: blue tint.

### 6.3 Toolbar + side panels

- **Toolbar**: filter chips (`All (N)` + dismissable active filters) / Sort dropdown (6 options) / **Columns ▾** menu / Export PDF / Export Excel / purple **Notes** button with count badge.
- **Filter panel** slides down: TQ score dual-range, quoted-amount Min/Max, verdict checkboxes (TQ / NTQ / ALB), Clear all / Apply.
- **Global Notes panel** slides down: 2-column per-vendor cards + general notes textarea.
- **Per-row notes popover** (280px, in-flow absolute): existing notes as gray cards + add-note textarea + purple Add button. Only one open at a time. Mutually exclusive with other panels.

### 6.4 Selection + confirmation flow

- Selecting any vendor radio slides up the **selection bar** below the table with vendor summary + reason dropdown (Custom reason → inline text input) + Clear / Confirm.
- **Confirm dialog — in-flow modal** (`position: absolute` within `.main-col` per the standard pattern). Summary table + Cancel / Confirm & Proceed.
- After confirm: table locks (radios disabled, "✓ Selected" pill in chosen row's SELECT cell), green success banner above the table, two action buttons below: **Download Comparative Statement (PDF)** (toast) + **Proceed to Bid Management →** (navigates to `bid-management.html?tender=<id>&selected=vendor-<slug>`).

### 6.5 `COMP` state schema

```js
{
  tnd, locked,
  selectedVendor, selectionReason, selectionCustomReason, selectionDate, selectionOfficer,
  notes: { general: [], '<vendor>': [{text, author, timestamp}, …] },
  columnVisibility: { rank:true, vendor:true, … },
  activeSort: { column, direction },
  activeFilters: { tqMin, tqMax, quoteMin, quoteMax, showTQ, showNTQ, showALB },
  activeMethod: null,        // overrides tender's declared method when set
  lcsCutoff: 75,
  fbsBudget: null,
  qcbsWeightage: { T:70, F:30 },
}
```

Tenders auto-seed via `seedCompletedDemo(tnd)` for TND-2026-007 so the "Selection made" demo state is immediately viewable.

---

## 7. `bid-management.html` — Bid Management

### 7.1 Page-level structure

- **Screen 1 — Landing**: title + subtitle, full-width search, 3-stat card row (Reasonableness amber / Committee blue / Award green), READY FOR BID MANAGEMENT list with status dot (amber pulsing / blue / purple / green), COMPLETED collapsible section.
- **Screen 2 — Workspace**: breadcrumb + Back, tender header bar with stage pill, **3- or 4-node stage progress** (Negotiation node conditional), stage tab pills (gated by completion).

### 7.2 Four sequential stages

1. **Stage 1 — Reasonableness Check**: Financial comparison card (EC / TS / L1 / vs EC / vs TS with colour-coded variance). Auto-determined banner — Case A reasonable / B above TS (Seek-fresh-approval | Re-tender decision cards) / C above EC by >10% (Proceed | **Initiate negotiation** triggers Stage 3 | Re-tender) / D ALB (red strip + enhanced-security requirement).
2. **Stage 2 — Committee Review**: Members card with `X of Y approved` progress + members table (avatar / name / designation / comment / verdict pill / date / action). Pending members get "Send reminder" amber button. "Your review" card with comment textarea + 4 verdict cards (Approve / Approve with conditions / Raise concern / **Request negotiation**). Amber concern resolution box appears for any raised concerns. Footer Complete CTA enabled only when all members submitted AND all concerns resolved.
3. **Stage 3 — Negotiation (conditional)**: Purple trigger context banner. Vendor notification card with portal-message preview + amber Send Invitation button. Sessions log with "+ Add session" — each session card has date/time/venue, participant chips, quote-movement table (Item / Original / Vendor Offer / Agreed / % Change) with totals, AI sustainability strip, editable session notes. Negotiation outcome card with green Accept / Reject.
4. **Stage 4 — Award & LoA** (4A + 4B in one stage body):
   - **4A — Award Recommendation**: vendor summary card (22px name + 28px primary amount + vs-EC/TS coloured + method pill + stats grid), AI-drafted recommendation note (contenteditable editor with toolbar + Regenerate link), collapsible attachments, pre-approval checklist (6 items), approval chain (Officer → Tech Officer → Commissioner) with avatars + Pending/Approved pills + "Simulate all approvals" demo link. Green "Recommendation approved by all" banner + "Proceed to issue LoA →" green CTA when all signed off.
   - **4B — Letter of Acceptance**: LoA Details form (auto-calc 5% performance security, auto +15d security deadline). **Preview LoA panel** — in-flow 720px slide-in within `.main-col` with full Times-New-Roman govt LoA letter. Vendor acknowledgement section with coloured countdown (green >7d / amber 0-7d / red pulsing overdue). "Issue LoA & Notify Vendor →" opens an in-flow confirmation modal; on confirm, success banner replaces CTAs with Download PDF + acknowledgement-status link.

### 7.3 Stage gating

`isStageLocked(key)` enforces sequence. Locked stage tabs are disabled and show a "Complete the previous stage first" toast on click.

### 7.4 `BM` state schema

```js
{
  tnd, stage,
  stage1Complete, reasonablenessDecision: { kind, note, authority, retenderReason, confirmed },
  stage2Complete, committeeMembers, resolutions,
  negotiationTriggered, negotiationReason,
  stage3Complete, invitationSent, invitationDate, negotiationSessions, negotiationOutcome, negotiatedAmount,
  stage4aComplete, recommendationNote,
  preApprovalChecks: { c1..c6 },
  approvalSent, approvalStatus: { officerId: {approved, date} },
  loaIssued, loaIssuedDate, loaAcknowledged, acknowledgementDate, acknowledgementBy,
  loaDetails: { vendorName, acceptedAmount, dateOfLoa, performanceSecurity, securityDeadline,
                commencementDate, completionDate, issuingAuthority, designation },
}
```

`BM_TENDERS` for landing list, `COMMITTEE_SEED` for the 3-member committee, `APPROVAL_CHAIN` for the approval workflow. `seedCompletedDemo()` fully completes TND-2026-007 (LoA issued + acknowledged).

---

## 8. Recent commit history (last ~15)

```
f902f79 Evaluation: fix PQ verdict popover bugs (close-on-click + cascading symptoms)
29fdd54 Evaluation: two more cross-page references killing Financial render
b94d870 Evaluation: fix Financial tab blank — winner-reveal helpers used cross-page name
db80e0c Evaluation: evidence column, committee scoring, presentations, winner-reveal, audit log
f67f734 evaluation done   (user's manual commit of the ribbon-removal change)
cc2d9b5 Bid Management: full rebuild — landing + 4-stage workspace
5208fde Bid Comparison: make the table fully method-aware
2f21bfd Bid Comparison: full rebuild of landing + workspace
52e1127 Evaluation: F1 upload rebuild, 5 methods, F3 Reasonableness, final TQ/NTQ table
ffb79da Evaluation PQ/TQ: View Bid CTA + full clarification request flow
99541cc Evaluation: landing search + awarded section + redesigned Technical tab
56c6009 Rename CLAUDE.md to Tender.md
afea3a5 Add CLAUDE.md — persistent project context
```

Working tree is clean. **~4 commits ahead of `origin/main`** as of last check (remote has no creds — push will fail until SSH/PAT/`gh` is set up).

---

## 9. Gotchas — avoid repeating these

### 9.1 Cross-page function name collisions

Each `.html` defines its own JS in an inline `<script>`. They don't share code. **Same name = different function on each page.** I've already hit three of these:

- `tenderDataset()` — exists in `comparative-statement.html` only. evaluation uses `EVAL.bids` / `finBidsBase()`.
- `METHOD_LABELS` — exists in `comparative-statement.html` only. evaluation uses `METHOD_META[m].short` / `.name`.
- `activeMethod()` — exists in `comparative-statement.html` only. evaluation uses `(EVAL.evaluationMethod || EVAL.method)`.

**Rule:** when copying code between pages, grep the destination first for every identifier the snippet references. Or sandbox-test (see 9.6).

### 9.2 `_seedV` migration pattern

When you change the shape of state, bump `_seedV` and the matching check:

```js
EVAL = (loaded && loaded._seedV === <new>) ? loaded : (tnd === 'TND-2026-001' ? seedDemo(tnd) : (loaded || freshState(tnd)));
```

Add migrations under that for any missing fields on older records. Current values:

| Page | `_seedV` |
|---|---|
| evaluation | **6** |
| comparative-statement | (uses different state model; no _seedV) |
| bid-management | (uses different state model; no _seedV) |

### 9.3 `innerHTML`-driven re-renders + outside-click handlers

If a handler replaces `pop.innerHTML` mid-click, the originally-clicked node detaches before the click bubbles to the document. `pop.contains(e.target)` then returns `false` and your outside-click close handler fires inappropriately. **Fix**: set `pop.onclick = ev => ev.stopPropagation()` (idempotent via `.onclick =`) at popover open time. Plus belt-and-braces `onclick="event.stopPropagation()"` on inline handlers inside the popover.

This was the PQ verdict popover bug (see `evaluation.html` line ~2150 onward).

### 9.4 Browser cache

You changed JS on disk, the served file is up to date, but the user still sees the broken page. **Two causes**:

1. Browser cached the previous evaluation.html (Cmd+Shift+R doesn't always purge in Safari).
2. The user is loading state from localStorage that predates the fix.

**Fix**: open with a cache-bust query param: `?tender=…&v=$(date +%s)`. To also nuke stored state: DevTools console → `localStorage.removeItem('eval_TND-2026-001'); location.reload();`

### 9.5 Claude Preview MCP sandbox can't read this repo

`mcp__Claude_Preview__preview_start` spawns Python from inside Claude.app's helper sandbox, which can't read `/Users/Anjali/Documents/GitHub/Tender-Analzer/`. **Every request 404s**. Use a plain Bash `python3 -m http.server 4180` background job instead and direct the user to their own browser. The Bash tool runs unsandboxed for this user.

### 9.6 Sandbox-trace before claiming "fixed"

For non-trivial rendering bugs, evaluate the inline `<script>` in a Node sandbox with DOM stubs and invoke the suspect entry point. This catches `ReferenceError`s that `node --check` (parse-only) misses. Template:

```bash
cat > /tmp/run-ev.js << 'EOF'
const fs = require('fs');
const html = fs.readFileSync('/Users/Anjali/Documents/GitHub/Tender-Analzer/evaluation.html','utf8');
const o = html.lastIndexOf('<script>'); const c = html.indexOf('</script>', o);
const src = html.slice(o+8, c);
// stub document / localStorage / sessionStorage / location / history / URLSearchParams
// then eval(src) and call the entry point
EOF
node /tmp/run-ev.js
```

I used this to catch `METHOD_LABELS` / `activeMethod` / `tenderDataset` errors that grep + syntax check both missed.

### 9.7 PQ matrix values

The PQ verdict matrix stores `'pass' | 'fail' | 'pending' | 'clarif'` — note **`clarif`** (not `clarification`). The spec sometimes says `clarification`. Don't change the stored value name without updating every reader (verdict pill rendering, `vendorVerdict()`, `s4Body()` clarification listing, the clarification-record sync in `setPqVerdict`).

### 9.8 Always use `esc()` when injecting user/data strings into template literals

evaluation.html and comparative-statement.html both define a local `esc()` (HTML-encode). Vendor names, file names, criteria — they're all plain text, no HTML, but XSS-safe-by-default is the convention here.

---

## 10. Things that currently work end-to-end

- **Evaluation**: full PQ flow (verdict popover with 4 cards, clarification draft + sent + received, evidence panel for each criterion, AI pre-screen), full TQ flow (3-member committee scoring with submit-locks, vendor presentations sub-section with video modal, AI pre-score), Results & Actions (Final TQ/NTQ table + clarification + NTQ justification + ready-for-financial), F1 upload + F2 evaluation with 5 methods + winner-first reveal, F3 reasonableness gating, **audit log panel** with seeded entries.
- **Bid Comparison**: full landing + workspace with method-aware table (5 methods, mask/reveal NOT implemented here — that's evaluation-only), per-vendor and global notes, filter panel + columns menu + sort dropdown, selection bar → in-flow confirm dialog → lock + success banner → Proceed to Bid Management.
- **Bid Management**: landing with 3-stat row + ready/completed lists, 4-stage workspace with conditional Negotiation, full LoA flow with Times-New-Roman preview panel, acknowledgement countdown, in-flow confirm modal.

---

## 11. Open / pending threads

- `_preview-stage4.html` is untracked. Either commit it, delete it, or add to `.gitignore` — flagged in my prior summary, no decision yet.
- `Tender.md` has stale "Next steps" wording (says ~17 commits local-only; actual count is now smaller). Could regenerate but low priority.
- `git push` will fail until SSH/PAT/`gh` is set up on the remote `origin`. The user knows.
- Bid Comparison page's winner-first reveal pattern is evaluation-only right now. Could be ported to comparative-statement if desired.
- Some legacy stubs left in evaluation.html that are orphaned but harmless (e.g. the old `cellPopover` matrix code, `fPickFile`, `uploadFinBid`). Flagged in prior summaries; cleanup would be a follow-up.

---

## 12. Working style established this session

- **One descriptive commit per task** with a `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` trailer. The repo has many of these — keep the style.
- After every significant change: `node --check` the extracted inline `<script>`, then a smoke-grep of the served HTML for the new feature strings, then commit.
- Don't say "fixed" until you've sandbox-traced (see 9.6) for anything rendering-related — I burned the user's trust twice this session by claiming a fix that didn't actually run end-to-end.
- The user prefers terse summaries with explicit "judgment calls" callouts when I had to interpret an ambiguous spec.

---

## 13. Working dev server

A background `python3 -m http.server 4180` may or may not still be running by the time you read this. To check / restart:

```bash
# check
lsof -i :4180 | grep LISTEN

# if free, start
cd /Users/Anjali/Documents/GitHub/Tender-Analzer && python3 -m http.server 4180

# main URLs
http://localhost:4180/evaluation.html?tender=TND-2026-001
http://localhost:4180/comparative-statement.html?tender=TND-2026-001
http://localhost:4180/bid-management.html?tender=TND-2026-001
http://localhost:4180/_preview-stage4.html      # one-shot Stage 4 demo seed + redirect
```

If a previous server is being weird, kill it: `lsof -i :4180 | grep LISTEN | awk '{print $2}' | xargs kill`

---

*End of handoff. Paste this whole file into the first message of a new Claude
conversation; that should give the next assistant everything it needs.*
