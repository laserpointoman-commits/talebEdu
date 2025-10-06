import { supabase } from '@/integrations/supabase/client';

export async function updateAdminPassword() {
  try {
    const { data, error } = await supabase.functions.invoke('update-admin-password', {
      body: {}
    });

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error updating admin password:', error);
    throw error;
  }
}