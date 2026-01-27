-- Fix the overly permissive INSERT policies
-- These should only allow users to insert their own data

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert activity" ON public.activity_feed;

-- Create proper INSERT policies that check user_id
CREATE POLICY "Users can insert own notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
ON public.activity_feed FOR INSERT
WITH CHECK (auth.uid() = user_id);