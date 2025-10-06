import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Shield, Eye, EyeOff, Save, RefreshCw, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FeatureVisibility {
  id?: string;
  role: string;
  feature_key: string;
  feature_name: string;
  is_visible: boolean;
  category?: string;
  description?: string;
}

const roles = ['admin', 'teacher', 'parent', 'student', 'driver', 'finance'] as const;

const categoryLabels: Record<string, string> = {
  admin: 'Administration',
  students: 'Students Management',
  teachers: 'Teachers Management',
  academic: 'Academic Features',
  transport: 'Transportation',
  services: 'Services',
  finance: 'Financial',
  communication: 'Communication',
  reports: 'Reports & Analytics',
  system: 'System Settings',
  staff: 'Staff Management',
  social: 'Social Features'
};

export default function FeatureVisibilityControl() {
  const { language } = useLanguage();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeRole, setActiveRole] = useState<string>('admin');
  const [visibilitySettings, setVisibilitySettings] = useState<FeatureVisibility[]>([]);
  const [originalSettings, setOriginalSettings] = useState<FeatureVisibility[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (profile?.role !== 'developer') {
      navigate('/dashboard');
      return;
    }
    fetchAllSettings();
  }, [profile, navigate]);

  useEffect(() => {
    // Check if there are unsaved changes
    const changes = JSON.stringify(visibilitySettings) !== JSON.stringify(originalSettings);
    setHasChanges(changes);
  }, [visibilitySettings, originalSettings]);

  const fetchAllSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('role_feature_visibility')
        .select('*')
        .order('role')
        .order('category')
        .order('feature_name');

      if (error) throw error;
      
      setVisibilitySettings(data || []);
      setOriginalSettings(data || []);
    } catch (error) {
      console.error('Error fetching visibility settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load visibility settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = (role: string, featureKey: string) => {
    setVisibilitySettings(prev => 
      prev.map(setting => 
        setting.role === role && setting.feature_key === featureKey
          ? { ...setting, is_visible: !setting.is_visible }
          : setting
      )
    );
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // Get only the changed settings
      const changedSettings = visibilitySettings.filter((setting, index) => {
        const original = originalSettings[index];
        return original && setting.is_visible !== original.is_visible;
      });

      if (changedSettings.length === 0) {
        toast({
          title: 'No changes',
          description: 'No changes to save',
        });
        return;
      }

      // Update all changed settings
      for (const setting of changedSettings) {
        const { error } = await supabase
          .from('role_feature_visibility')
          .update({ 
            is_visible: setting.is_visible,
            updated_at: new Date().toISOString()
          })
          .eq('id', setting.id);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: `Updated ${changedSettings.length} feature visibility settings`,
      });

      // Refresh the settings
      await fetchAllSettings();
    } catch (error) {
      console.error('Error saving visibility settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save visibility settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetChanges = () => {
    setVisibilitySettings(originalSettings);
    toast({
      title: 'Changes reset',
      description: 'All unsaved changes have been discarded',
    });
  };

  const getRoleSettings = (role: string) => {
    return visibilitySettings.filter(s => s.role === role);
  };

  const groupByCategory = (settings: FeatureVisibility[]) => {
    return settings.reduce((acc, setting) => {
      const category = setting.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(setting);
      return acc;
    }, {} as Record<string, FeatureVisibility[]>);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Feature Visibility Control</CardTitle>
                <CardDescription>
                  Manage which features are visible for each role
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              {hasChanges && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleResetChanges}
                    disabled={saving}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button
                    onClick={handleSaveChanges}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hasChanges && (
            <Alert className="mb-4">
              <Settings className="h-4 w-4" />
              <AlertDescription>
                You have unsaved changes. Click "Save Changes" to apply them or "Reset" to discard.
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeRole} onValueChange={setActiveRole}>
            <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-1">
              {roles.map(role => (
                <TabsTrigger key={role} value={role} className="capitalize">
                  {role}
                </TabsTrigger>
              ))}
            </TabsList>

            {roles.map(role => {
              const roleSettings = getRoleSettings(role);
              const groupedSettings = groupByCategory(roleSettings);

              return (
                <TabsContent key={role} value={role}>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-6">
                      {Object.entries(groupedSettings).map(([category, features]) => (
                        <div key={category}>
                          <div className="mb-3">
                            <h3 className="text-lg font-semibold">
                              {categoryLabels[category] || category}
                            </h3>
                            <Separator className="mt-2" />
                          </div>
                          <div className="space-y-3">
                            {features.map(feature => (
                              <div
                                key={feature.feature_key}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    {feature.is_visible ? (
                                      <Eye className="h-4 w-4 text-primary" />
                                    ) : (
                                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div>
                                    <Label htmlFor={`${role}-${feature.feature_key}`} className="cursor-pointer">
                                      {feature.feature_name}
                                    </Label>
                                    {feature.description && (
                                      <p className="text-sm text-muted-foreground">
                                        {feature.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge variant={feature.is_visible ? 'default' : 'secondary'}>
                                    {feature.is_visible ? 'Visible' : 'Hidden'}
                                  </Badge>
                                  <Switch
                                    id={`${role}-${feature.feature_key}`}
                                    checked={feature.is_visible}
                                    onCheckedChange={() => handleToggleFeature(role, feature.feature_key)}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      {roleSettings.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No features configured for this role
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}