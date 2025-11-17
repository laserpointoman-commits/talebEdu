import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import * as Icons from 'lucide-react';

type UserRole = 'admin' | 'teacher' | 'parent' | 'student' | 'driver' | 'finance' | 'developer' | 'canteen' | 'school_attendance' | 'bus_attendance';

interface QuickAction {
  id: string;
  role: UserRole;
  title: string;
  href: string;
  icon: string;
  display_order: number;
  is_active: boolean;
}

const availableIcons = [
  'GraduationCap', 'Users', 'BookOpen', 'Calendar', 'ClipboardList', 'DollarSign',
  'Bus', 'ShoppingBag', 'MessageSquare', 'FileText', 'Settings', 'Wallet',
  'MapPin', 'Award', 'Package', 'ChefHat', 'Code', 'Receipt', 'CreditCard',
  'Home', 'Bell', 'User', 'Mail', 'Phone', 'Camera', 'Edit', 'Trash'
];

export default function QuickActionsManager() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAction, setNewAction] = useState({
    title: '',
    href: '',
    icon: 'Home'
  });

  const { data: actions = [], isLoading } = useQuery({
    queryKey: ['quick-actions', selectedRole],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quick_actions')
        .select('*')
        .eq('role', selectedRole)
        .order('display_order');
      
      if (error) throw error;
      return data as QuickAction[];
    }
  });

  const addMutation = useMutation({
    mutationFn: async (action: Omit<QuickAction, 'id' | 'is_active'>) => {
      const { error } = await supabase
        .from('quick_actions')
        .insert(action);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-actions'] });
      toast.success('Quick action added');
      setIsAddDialogOpen(false);
      setNewAction({ title: '', href: '', icon: 'Home' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<QuickAction> }) => {
      const { error } = await supabase
        .from('quick_actions')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-actions'] });
      toast.success('Quick action updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quick_actions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-actions'] });
      toast.success('Quick action deleted');
    }
  });

  const handleAddAction = () => {
    if (!newAction.title || !newAction.href) {
      toast.error('Please fill all fields');
      return;
    }

    const maxOrder = Math.max(...actions.map(a => a.display_order), 0);
    
    addMutation.mutate({
      role: selectedRole,
      title: newAction.title,
      href: newAction.href,
      icon: newAction.icon,
      display_order: maxOrder + 1
    });
  };

  const IconComponent = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.Home;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quick Actions Manager</h1>
          <p className="text-muted-foreground mt-2">Configure quick action buttons for each role</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Quick Action
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Quick Action for {selectedRole}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title (translation key)</Label>
                <Input
                  value={newAction.title}
                  onChange={(e) => setNewAction({ ...newAction, title: e.target.value })}
                  placeholder="dashboard.students"
                />
              </div>
              <div>
                <Label>URL Path</Label>
                <Input
                  value={newAction.href}
                  onChange={(e) => setNewAction({ ...newAction, href: e.target.value })}
                  placeholder="/dashboard/students"
                />
              </div>
              <div>
                <Label>Icon</Label>
                <Select value={newAction.icon} onValueChange={(value) => setNewAction({ ...newAction, icon: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableIcons.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        <div className="flex items-center gap-2">
                          {IconComponent(icon)}
                          {icon}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddAction} className="w-full" disabled={addMutation.isPending}>
                Add Action
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Role</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="parent">Parent</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="driver">Driver</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="canteen">Canteen</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions for {selectedRole}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : actions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No quick actions configured for this role</p>
          ) : (
            <div className="space-y-2">
              {actions.map((action, index) => (
                <div
                  key={action.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                  
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {IconComponent(action.icon)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{t(action.title)}</p>
                      <p className="text-sm text-muted-foreground">{action.href}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Active</Label>
                      <Switch
                        checked={action.is_active}
                        onCheckedChange={(checked) => 
                          updateMutation.mutate({ 
                            id: action.id, 
                            updates: { is_active: checked } 
                          })
                        }
                      />
                    </div>
                    
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteMutation.mutate(action.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
