
-- Fix tasks assignee policy: drop useless profiles join
DROP POLICY IF EXISTS "Assignees can view assigned tasks within organization" ON public.tasks;

CREATE POLICY "Assignees can view assigned tasks within organization"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.id = tasks.assignee_id
      AND tm.user_id = tasks.user_id
      AND lower(tm.email) = lower(COALESCE(
        (SELECT u.email FROM auth.users u WHERE u.id = auth.uid()),
        ''
      )::text)
  )
);

-- Webhooks: prevent reading the stored secret hash via the API.
-- Add a generated boolean so the UI can show "Signed" without exposing secret_key.
ALTER TABLE public.webhooks
  ADD COLUMN IF NOT EXISTS has_secret boolean
  GENERATED ALWAYS AS (secret_key IS NOT NULL) STORED;

REVOKE SELECT (secret_key) ON public.webhooks FROM authenticated;
REVOKE SELECT (secret_key) ON public.webhooks FROM anon;
