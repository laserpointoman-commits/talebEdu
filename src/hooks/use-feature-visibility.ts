import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FeatureVisibility {
  id?: string;
  role: string;
  feature_key: string;
  feature_name: string;
  is_visible: boolean;
  category?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export function useFeatureVisibility() {
  const { profile } = useAuth();
  const [visibilitySettings, setVisibilitySettings] = useState<FeatureVisibility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role) {
      fetchVisibilitySettings();
    }
  }, [profile?.role]);

  const fetchVisibilitySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('role_feature_visibility')
        .select('*')
        .eq('role', profile?.role);

      if (error) throw error;
      setVisibilitySettings(data || []);
    } catch (error) {
      console.error('Error fetching visibility settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('role_feature_visibility')
        .select('*')
        .order('role')
        .order('category')
        .order('feature_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all visibility settings:', error);
      return [];
    }
  };

  const isFeatureVisible = (featureKey: string): boolean => {
    // Developers always see everything
    if (profile?.role === 'developer') return true;
    
    const setting = visibilitySettings.find(s => s.feature_key === featureKey);
    return setting?.is_visible ?? true; // Default to visible if not configured
  };

  const updateVisibility = async (
    role: string, 
    featureKey: string, 
    featureName: string,
    isVisible: boolean,
    category?: string
  ) => {
    try {
      const { error } = await supabase
        .from('role_feature_visibility')
        .upsert({
          role: role as any,
          feature_key: featureKey,
          feature_name: featureName,
          is_visible: isVisible,
          category: category,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'role,feature_key'
        });

      if (error) throw error;
      
      // Refresh settings if updating current user's role
      if (role === profile?.role) {
        await fetchVisibilitySettings();
      }
      return true;
    } catch (error) {
      console.error('Error updating visibility:', error);
      return false;
    }
  };

  return {
    isFeatureVisible,
    updateVisibility,
    visibilitySettings,
    loading,
    fetchAllSettings,
    refetch: fetchVisibilitySettings
  };
}