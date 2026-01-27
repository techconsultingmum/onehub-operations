-- Fix: Remove the assignee_id condition from the "Users can view own tasks" policy
-- The assignee_id could potentially be guessed/manipulated. 
-- Instead, rely on proper assignment through team membership or explicit task sharing.

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;

-- Create a more secure policy - users can only view tasks they created
CREATE POLICY "Users can view own tasks"
ON public.tasks
FOR SELECT
USING (auth.uid() = user_id);

-- Note: Admins and managers can still view all tasks via their existing policy