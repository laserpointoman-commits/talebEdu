-- FIX CRITICAL SECURITY ISSUES

-- 1. Fix profiles table - only allow users to see their own profile
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON profiles;
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can view profiles they're related to"
ON profiles FOR SELECT
USING (
  -- Admins can see all
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR 
  -- Parents can see their children's profiles
  id IN (SELECT id FROM profiles WHERE parent_user_id = auth.uid())
);

-- 2. Fix students table - restrict access properly
DROP POLICY IF EXISTS "Authenticated users can view students" ON students;

CREATE POLICY "Students can only view own data"
ON students FOR SELECT
USING (profile_id = auth.uid());

-- 3. Fix employees table - restrict sensitive data
CREATE POLICY "Employees can only view own sensitive data"
ON employees FOR SELECT
USING (
  profile_id = auth.uid()
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Fix conversation/friendship system permissions
DROP POLICY IF EXISTS "System can create conversations" ON conversations;
DROP POLICY IF EXISTS "System can manage participants" ON conversation_participants;
DROP POLICY IF EXISTS "System can manage friendships" ON friendships;

CREATE POLICY "Only participants can create conversations"
ON conversations FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "Only friends can manage friendships"
ON friendships FOR ALL
USING (
  student1_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
  OR
  student2_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
);