import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface QuickAction {
  id: string;
  title: string;
  href: string;
  icon: string;
  display_order: number;
  is_active: boolean;
}

interface UserPreference {
  id: string;
  quick_action_id: string;
  is_visible: boolean;
  custom_order: number | null;
}

interface QuickActionWithPreference extends QuickAction {
  user_preference_id?: string;
  is_visible: boolean;
  custom_order: number | null;
}

export function useQuickActionPreferences() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const userRole = profile?.role || 'student';

  const { data: actions = [], isLoading } = useQuery({
    queryKey: ['quick-actions-with-preferences', userRole, profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      // Fetch default quick actions for role
      const { data: defaultActions, error: actionsError } = await supabase
        .from('quick_actions')
        .select('*')
        .eq('role', userRole)
        .eq('is_active', true)
        .order('display_order');

      if (actionsError) throw actionsError;

      // Fetch user preferences
      const { data: preferences, error: prefsError } = await supabase
        .from('user_quick_action_preferences')
        .select('*')
        .eq('user_id', profile.id);

      if (prefsError) throw prefsError;

      // Merge defaults with preferences
      const actionsWithPrefs: QuickActionWithPreference[] = defaultActions.map(action => {
        const pref = preferences?.find(p => p.quick_action_id === action.id);
        return {
          ...action,
          user_preference_id: pref?.id,
          is_visible: pref?.is_visible ?? true,
          custom_order: pref?.custom_order ?? null
        };
      });

      // Sort by custom order if set, otherwise by display order
      return actionsWithPrefs.sort((a, b) => {
        const orderA = a.custom_order ?? a.display_order;
        const orderB = b.custom_order ?? b.display_order;
        return orderA - orderB;
      });
    },
    enabled: !!profile?.id
  });

  const updatePreference = useMutation({
    mutationFn: async ({ 
      actionId, 
      isVisible, 
      customOrder 
    }: { 
      actionId: string; 
      isVisible?: boolean; 
      customOrder?: number | null 
    }) => {
      if (!profile?.id) throw new Error('Not authenticated');

      const existingPref = actions.find(a => a.id === actionId);
      
      if (existingPref?.user_preference_id) {
        // Update existing preference
        const updates: any = { updated_at: new Date().toISOString() };
        if (isVisible !== undefined) updates.is_visible = isVisible;
        if (customOrder !== undefined) updates.custom_order = customOrder;

        const { error } = await supabase
          .from('user_quick_action_preferences')
          .update(updates)
          .eq('id', existingPref.user_preference_id);

        if (error) throw error;
      } else {
        // Create new preference
        const { error } = await supabase
          .from('user_quick_action_preferences')
          .insert({
            user_id: profile.id,
            quick_action_id: actionId,
            is_visible: isVisible ?? true,
            custom_order: customOrder ?? null
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-actions-with-preferences'] });
      toast.success('Quick action preference updated');
    },
    onError: (error) => {
      toast.error('Failed to update preference');
      console.error(error);
    }
  });

  const resetPreferences = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_quick_action_preferences')
        .delete()
        .eq('user_id', profile.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-actions-with-preferences'] });
      toast.success('Quick actions reset to defaults');
    }
  });

  const visibleActions = actions.filter(a => a.is_visible).slice(0, 8);

  return {
    allActions: actions,
    visibleActions,
    isLoading,
    updatePreference,
    resetPreferences
  };
}
