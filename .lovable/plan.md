## Plan: 4 Major Feature Additions

I'll build these as cohesive additions to the existing dashboard. Here's the approach for each:

### 1. Organization Setup Wizard (`/dashboard/setup`)
A multi-step wizard component (3 steps):
- **Step 1 — Workspace**: name + slug (saved to a new `organizations` table or extended `user_configurations`)
- **Step 2 — Team invites**: email + role chips, batch invite via `team_members` table (already exists)
- **Step 3 — Industry template**: reuses `industry-config.ts` options; pre-seeds dashboard widgets

Progress bar at top, Back/Next buttons, validation per step with Zod. Skippable steps. Final "Finish" creates everything atomically.

### 2. Webhook Tester (extend `/dashboard/webhooks`)
Add a "Test" button on each webhook row → opens a dialog with:
- Sample event selector (task.created / task.updated / complaint.created / custom JSON)
- Editable JSON payload (validated)
- "Send Test" button → calls a new edge function `webhook-test` that signs the payload with the webhook secret and POSTs it
- Live result panel: status code, latency, response body, retry button (up to 3 retries with exponential backoff)
- Recent test results pulled from `webhook_logs`

### 3. Google Sheets Import (extend `/dashboard/import`)
Add a "Google Sheets" tab alongside CSV:
- Input: paste Google Sheets URL (public sheet or via connector)
- Fetch preview via new edge function `sheets-import` using the `google_sheets` connector gateway
- Column mapping UI: source column → target field (task title/status/priority/etc.)
- Validation panel: row count, missing required fields, type mismatches
- **Dry-run** toggle: shows what would be imported without writing
- "Import" button: writes rows to `tasks` table; logs to `data_imports`

*Requires the Google Sheets connector to be linked. If not linked, show a CTA to connect.*

### 4. Activity Log Viewer (`/dashboard/activity`)
New page reading from existing `activity_feed` table:
- Filters: date range, action type, entity type, user
- Sortable table with paginated results (React Query)
- "Export CSV" button generates a CSV client-side from filtered results
- Sidebar nav entry with `History` icon

### Shared infrastructure
- New sidebar entries: "Setup Wizard", "Activity Log"
- 1 migration: `organizations` table (optional — may reuse `user_configurations`), ensure `activity_feed` has indexes on `created_at`, `user_id`, `action_type`
- 2 edge functions: `webhook-test`, `sheets-import`
- Reuses existing `useDocumentTitle`, `ConfirmDialog`, shadcn primitives, semantic tokens

### Technical notes
- All new tables get GRANTs + RLS scoped to `auth.uid()` and admin role
- Wizard state stored in component state + persisted to localStorage so users can resume
- Webhook test edge function reuses existing webhook signing helper
- Sheets import requires user to link the Google Sheets connector; flow will guide them
- CSV export uses a small client-side helper (no new deps)

Estimated scope: ~10 new files, 2 edge functions, 1 migration, 4 sidebar entries.
