-- Fix RLS policies for security issues

-- 1. Fix team_members table to properly restrict access to only owners and admins
DROP POLICY IF EXISTS "Users can view own team members" ON public.team_members;
DROP POLICY IF EXISTS "Admins can view all team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can manage own team members" ON public.team_members;

-- Users can only see their own team members
CREATE POLICY "Users can view own team members"
  ON public.team_members
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all team members
CREATE POLICY "Admins can view all team members"
  ON public.team_members
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert their own team members
CREATE POLICY "Users can insert own team members"
  ON public.team_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own team members
CREATE POLICY "Users can update own team members"
  ON public.team_members
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own team members
CREATE POLICY "Users can delete own team members"
  ON public.team_members
  FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Fix tasks table - allow assignees to view tasks assigned to them
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;

-- Users can view tasks they own OR tasks assigned to them
CREATE POLICY "Users can view own or assigned tasks"
  ON public.tasks
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = assignee_id);

-- 3. Fix webhooks table - ensure only authenticated users can access
DROP POLICY IF EXISTS "Users can manage own webhooks" ON public.webhooks;

-- Restrict webhooks to authenticated users only (not anon)
CREATE POLICY "Authenticated users can manage own webhooks"
  ON public.webhooks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Add policies for data_imports - restrict to authenticated users
DROP POLICY IF EXISTS "Users can manage own data imports" ON public.data_imports;

CREATE POLICY "Authenticated users can manage own data imports"
  ON public.data_imports
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Add policies for webhook_logs - restrict to authenticated users and allow inserts via service role
DROP POLICY IF EXISTS "Users can view own webhook logs" ON public.webhook_logs;

CREATE POLICY "Authenticated users can view own webhook logs"
  ON public.webhook_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);