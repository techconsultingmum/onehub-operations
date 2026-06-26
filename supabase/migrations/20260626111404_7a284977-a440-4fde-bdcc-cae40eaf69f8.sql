
ALTER TABLE public.webhooks DROP COLUMN IF EXISTS has_secret;
ALTER TABLE public.webhooks ADD COLUMN secret_hash text;
ALTER TABLE public.webhooks ADD COLUMN has_secret boolean GENERATED ALWAYS AS (secret_hash IS NOT NULL) STORED;

REVOKE SELECT (secret_hash) ON public.webhooks FROM authenticated, anon;
