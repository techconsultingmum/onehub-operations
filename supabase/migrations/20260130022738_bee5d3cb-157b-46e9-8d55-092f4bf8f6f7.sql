-- Fix webhook_logs: Add restrictive INSERT policy to prevent fake audit logs
-- Only allow inserts through service role (backend functions) by denying all direct user inserts

CREATE POLICY "Deny direct user inserts to webhook_logs" 
ON public.webhook_logs 
FOR INSERT 
TO authenticated
WITH CHECK (false);

-- Add a comment explaining that webhook_logs should only be inserted by service role/edge functions
COMMENT ON TABLE public.webhook_logs IS 'Audit log for webhook deliveries. Direct user inserts are blocked - only service role or edge functions should write to this table.';