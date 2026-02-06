-- Drop the existing flawed policy for assignee task access
DROP POLICY IF EXISTS "Assignees can view tasks from same organization" ON public.tasks;

-- Create a corrected policy that properly validates organizational boundaries
-- The assignee should be able to view tasks where:
-- 1. The task's assignee_id matches a team_member.id 
-- 2. That team_member belongs to the task owner (tm.user_id = tasks.user_id)
-- 3. The authenticated user owns that team_member record OR is the actual team member
-- Since team_members are created by users (user_id = creator), we need to link auth.uid() 
-- to the team member through email matching with the profiles table

-- First, let's create a simpler, more secure approach:
-- Assignees can view tasks if they are assigned AND the task owner has them as a team member
CREATE POLICY "Assignees can view assigned tasks within organization" 
ON public.tasks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.team_members tm
    JOIN public.profiles p ON p.user_id = auth.uid()
    WHERE tm.id = tasks.assignee_id 
      AND tm.user_id = tasks.user_id
      AND LOWER(tm.email) = LOWER(
        COALESCE(
          (SELECT email FROM auth.users WHERE id = auth.uid()),
          ''
        )
      )
  )
);