
DROP POLICY IF EXISTS "Assignees can view assigned tasks within organization" ON public.tasks;

ALTER TABLE public.webhooks DROP COLUMN IF EXISTS has_secret;
ALTER TABLE public.webhooks DROP COLUMN IF EXISTS secret_key;
ALTER TABLE public.webhooks ADD COLUMN has_secret boolean NOT NULL DEFAULT false;
