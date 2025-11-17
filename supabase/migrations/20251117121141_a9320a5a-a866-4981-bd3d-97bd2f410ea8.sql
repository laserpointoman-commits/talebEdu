-- Create user preferences table for quick actions
CREATE TABLE public.user_quick_action_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quick_action_id UUID NOT NULL REFERENCES public.quick_actions(id) ON DELETE CASCADE,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  custom_order INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, quick_action_id)
);

-- Enable RLS
ALTER TABLE public.user_quick_action_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own preferences
CREATE POLICY "Users can manage their own quick action preferences"
ON public.user_quick_action_preferences
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);