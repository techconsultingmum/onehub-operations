-- Add support for multiple management types per user
ALTER TABLE public.user_configurations 
ADD COLUMN IF NOT EXISTS additional_management_types text[] DEFAULT '{}';

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info', -- info, success, warning, error, task, team
  read boolean NOT NULL DEFAULT false,
  link text, -- optional link to navigate to
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- System can insert notifications (via service role)
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  email_notifications boolean NOT NULL DEFAULT true,
  push_notifications boolean NOT NULL DEFAULT true,
  task_updates boolean NOT NULL DEFAULT true,
  team_updates boolean NOT NULL DEFAULT true,
  weekly_digest boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_preferences
CREATE POLICY "Users can manage own notification preferences"
ON public.notification_preferences FOR ALL
USING (auth.uid() = user_id);

-- Create webhooks table
CREATE TABLE public.webhooks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  url text NOT NULL,
  type text NOT NULL DEFAULT 'custom', -- slack, custom
  events text[] NOT NULL DEFAULT '{}', -- task_created, task_updated, task_completed, status_changed
  is_active boolean NOT NULL DEFAULT true,
  secret_key text, -- for signature verification
  headers jsonb DEFAULT '{}',
  last_triggered_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on webhooks
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- RLS policies for webhooks
CREATE POLICY "Users can manage own webhooks"
ON public.webhooks FOR ALL
USING (auth.uid() = user_id);

-- Create webhook_logs table for tracking webhook executions
CREATE TABLE public.webhook_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id uuid NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  response_status integer,
  response_body text,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on webhook_logs
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for webhook_logs
CREATE POLICY "Users can view own webhook logs"
ON public.webhook_logs FOR SELECT
USING (auth.uid() = user_id);

-- Create data_imports table for tracking CSV imports
CREATE TABLE public.data_imports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  target_table text NOT NULL, -- tasks, team_members
  column_mapping jsonb NOT NULL, -- maps CSV columns to table columns
  total_rows integer NOT NULL DEFAULT 0,
  imported_rows integer NOT NULL DEFAULT 0,
  failed_rows integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  error_details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS on data_imports
ALTER TABLE public.data_imports ENABLE ROW LEVEL SECURITY;

-- RLS policies for data_imports
CREATE POLICY "Users can manage own data imports"
ON public.data_imports FOR ALL
USING (auth.uid() = user_id);

-- Create activity_feed table
CREATE TABLE public.activity_feed (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action text NOT NULL, -- created, updated, deleted, completed, assigned
  entity_type text NOT NULL, -- task, team_member, webhook, import
  entity_id uuid,
  entity_name text,
  details jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on activity_feed
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- RLS policies for activity_feed
CREATE POLICY "Users can view own activity"
ON public.activity_feed FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity"
ON public.activity_feed FOR INSERT
WITH CHECK (true);

-- Add triggers for updated_at columns
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at
BEFORE UPDATE ON public.webhooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();