-- Update RLS policies for members table
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_public_member_lookup"
ON public.members FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "members_update_own_record"
ON public.members FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid());