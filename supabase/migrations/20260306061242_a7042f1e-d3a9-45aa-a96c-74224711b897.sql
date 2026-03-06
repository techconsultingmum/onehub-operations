-- Drop the problematic policy that applies to public role
DROP POLICY IF EXISTS "Assignees can view assigned tasks within organization" ON public.tasks;

-- Recreate it targeting only authenticated users
CREATE POLICY "Assignees can view assigned tasks within organization"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM team_members tm
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE tm.id = tasks.assignee_id
      AND tm.user_id = tasks.user_id
      AND lower(tm.email) = lower(
        COALESCE(
          (SELECT users.email FROM auth.users WHERE users.id = auth.uid()),
          ''
        )::text
      )
  )
);