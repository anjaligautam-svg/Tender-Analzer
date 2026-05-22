# Project Context — TenderAI Procurement Portal

A multi-page government procurement web app for Ahmedabad Municipal Corporation:
DPR creation → tender creation → pre-bid queries → bid management → evaluation →
bid comparison → award.

## Architecture
- **Plain static HTML/JS** — no framework, no build step, no bundler.
- Each page is **one self-contained `.html` file** with an embedded `<style>`
  block and one main `<script>` block.
- **Tailwind CSS via CDN** (`cdn.tailwindcss.com`) + an inline `tailwind.config`
  repeated in every file. **DM Sans** font (Google Fonts). **Lucide** icons (UMD CDN).
- **localStorage** for per-tender working state; **sessionStorage** for login.
- Served locally: `python3 -m http.server 4173` from the repo root. Preview
  config in `.claude/launch.json`.

### Pages (files)
| File | Module |
|---|---|
| `index.html` | Procurement Dashboard |
| `dpr-creation.html` | DPR Creation |
| `tender-creation.html` | Tender Creation (7-step wizard) |
| `prebid-queries.html` | Pre-Bid Queries |
| `evaluation.html` | Bid Evaluation (technical + financial) |
| `comparative-statement.html` | Bid Comparison |
| `bid-management.html` | Bid Management (4-stage award workspace) |
| `login.html`, `login-v2.html` | Login |

### Sidebar nav order (identical on all 7 pages with a sidebar)
OVERVIEW: Dashboard · TENDERING: DPR Creation, Tender Creation, Pre-Bid Queries ·
EVALUATING: **Bid Evaluation, Bid Comparison, Bid Management**, AI Assistant ·
POST AWARD: Analytics.

## Design tokens (match exactly — never introduce new ones)
```
Primary  #0F5EE8  / light #EFF6FF      Success #10B981 / light #F0FDF4
Warning  #F59E0B  / light #FFFBEB      Danger  #EF4444 / light #FEF2F2
Purple   #8B5CF6  / light #EEEDFE
Text     #111827 / #6B7280 / #9CA3AF   Border #E5E7EB   Surface #F9FAFB
Radius   8px inputs · 12px cards · 16px large        Font: DM Sans
Transitions  150ms hover · 200ms expand/collapse · 250–300ms reveals
```

## Key decisions / conventions
- Module pages follow a **landing list → workspace** pattern; the workspace is
  reached via `?tender=TND-XXXX` query param.
- Per-tender state objects persisted to localStorage:
  `eval_<TND>`, `comparison_<TND>`, `bidmgmt_<TND>`. Seed-version guard `_seedV`
  forces a re-seed when the demo data shape changes.
- **`TND-2026-001` is the primary fully-seeded demo tender** — it is seeded
  through technical evaluation so downstream screens are immediately viewable.
- Render functions rebuild `innerHTML`; UI-only prefs (e.g. `activeView`) live in
  JS variables, not localStorage.
- Prefer **in-flow panels / dialogs** over `position:fixed` modals where the page
  is viewed inside the preview iframe (fixed overlays break it).
- AI suggestions are shown as **inline, non-blocking** strips/chips.
- Tables use `table-layout: fixed`. Accessibility: `aria-live` on counters,
  `aria-pressed`/`aria-current` where relevant, visible focus rings.
- After each change: validate JS with a quick `node -e "new Function(script)"`
  syntax check, then verify in the preview before committing.
- One descriptive commit per task. Commits include a `Co-Authored-By` trailer.

## Current task / goal
No active task. Last completed work: the **L1 / QCBS view toggle** in Section F2
of `evaluation.html` (commit `9ed19cc`).

## Completed
- [x] Pre-Bid Queries — post-meeting triage, Documentation/Register tab,
      Corrigendum AI-amendment summary, Upload Tender modal
- [x] Tender Creation Step 2 — full Add PQ/TQ Criterion flows + interactive
      Key Technical Personnel table
- [x] Bid Evaluation (`evaluation.html`) — landing + workspace; Technical tab
      (4 sections incl. PQ/TQ matrix); Financial tab F1/F2 with L1/QCBS toggle;
      upload-tender panel on the landing page
- [x] Bid Comparison (`comparative-statement.html`) — new page, comparison
      workspace with ALB handling and lock
- [x] Bid Management (`bid-management.html`) — 4-stage award workspace
      (Reasonableness Check → Committee Review → Negotiation → Award Recommendation)
- [x] Sidebar reorder — Bid Evaluation / Bid Comparison / Bid Management

## Next steps
- [ ] **Push commits to GitHub** — ~17 commits are local-only; the HTTPS remote
      has no credentials configured, so `git push` fails. Needs a PAT, SSH key,
      or `gh` CLI before anything can be pushed.
- [ ] No other feature work is queued — await the next prompt.

## Working-directory constraint
All work happens in `/Users/Anjali/Documents/GitHub/Tender-Analzer/`. Do not edit
the older copy at `/Users/Anjali/tenderai-prebid/`.
