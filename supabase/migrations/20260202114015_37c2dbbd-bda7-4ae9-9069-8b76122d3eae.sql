-- Fix: tasks_assignee_data_leak
-- The issue is that any user can be assigned to a task and see its details
-- We need to ensure assignees can only view tasks where:
-- 1. They created the task (user_id = auth.uid())
-- 2. They are the assignee AND the task creator is in their team

-- First, drop the existing policy that allows viewing assigned tasks without team verification
DROP POLICY IF EXISTS "Authenticated users can view own or assigned tasks" ON public.tasks;

-- Create a more restrictive policy that verifies team membership
-- A user can view a task if:
-- 1. They own the task (user_id = auth.uid())
-- 2. They are assigned to the task AND both they and the task owner belong to the same organization (share team members)

CREATE POLICY "Users can view own tasks" 
ON public.tasks 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Assignees can view tasks from same organization" 
ON public.tasks 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = assignee_id 
  AND EXISTS (
    -- Verify the task owner has the assignee in their team_members
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = tasks.user_id
    AND tm.id = tasks.assignee_id
  )
);