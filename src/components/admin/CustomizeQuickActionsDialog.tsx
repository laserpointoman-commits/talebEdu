import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, GripVertical, RotateCcw } from 'lucide-react';
import { useQuickActionPreferences } from '@/hooks/use-quick-action-preferences';
import * as Icons from 'lucide-react';

export function CustomizeQuickActionsDialog() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const { allActions, updatePreference, resetPreferences, isLoading } = useQuickActionPreferences();

  const getIconComponent = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.Home;
    return Icon;
  };

  const handleToggleVisibility = (actionId: string, currentVisibility: boolean) => {
    updatePreference.mutate({ 
      actionId, 
      isVisible: !currentVisibility 
    });
  };

  const handleResetToDefaults = () => {
    if (confirm('Are you sure you want to reset all quick actions to default settings?')) {
      resetPreferences.mutate();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{t('Customize Quick Actions')}</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleResetToDefaults}
              disabled={resetPreferences.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('Reset to Defaults')}
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('Loading...')}
            </div>
          ) : allActions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('No quick actions available')}
            </div>
          ) : (
            allActions.map((action) => {
              const Icon = getIconComponent(action.icon);
              return (
                <div
                  key={action.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground opacity-50" />
                  
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{t(action.title)}</p>
                      <p className="text-sm text-muted-foreground">{action.href}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-sm cursor-pointer" htmlFor={`visible-${action.id}`}>
                      {t('Visible')}
                    </Label>
                    <Switch
                      id={`visible-${action.id}`}
                      checked={action.is_visible}
                      onCheckedChange={() => handleToggleVisibility(action.id, action.is_visible)}
                      disabled={updatePreference.isPending}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>{t('Tip:')}</strong> {t('Toggle the visibility switch to show or hide quick action buttons on your dashboard. Only visible actions will appear.')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
