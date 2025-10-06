import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, GripVertical, Tag } from 'lucide-react';
import { toast } from 'sonner';
import LogoLoader from '@/components/LogoLoader';

interface Category {
  id: string;
  name: string;
  name_ar: string | null;
  icon: string;
  color: string;
  display_order: number;
  is_active: boolean;
}

export default function CategoryManagement() {
  const { language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    icon: '📦',
    color: 'hsl(var(--primary))',
    is_active: true
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('canteen_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast.error(language === 'en' ? 'Failed to load categories' : 'فشل تحميل الفئات');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name) {
      toast.error(language === 'en' ? 'Please enter category name' : 'الرجاء إدخال اسم الفئة');
      return;
    }

    try {
      const maxOrder = Math.max(...categories.map(c => c.display_order), 0);
      
      const { data, error } = await supabase
        .from('canteen_categories')
        .insert([{
          name: formData.name,
          name_ar: formData.name_ar || null,
          icon: formData.icon,
          color: formData.color,
          is_active: formData.is_active,
          display_order: maxOrder + 1
        }])
        .select()
        .single();

      if (error) throw error;

      setCategories([...categories, data]);
      setIsAddDialogOpen(false);
      resetForm();
      toast.success(language === 'en' ? 'Category added successfully' : 'تمت إضافة الفئة بنجاح');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = async () => {
    if (!selectedCategory || !formData.name) {
      toast.error(language === 'en' ? 'Please enter category name' : 'الرجاء إدخال اسم الفئة');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('canteen_categories')
        .update({
          name: formData.name,
          name_ar: formData.name_ar || null,
          icon: formData.icon,
          color: formData.color,
          is_active: formData.is_active
        })
        .eq('id', selectedCategory.id)
        .select()
        .single();

      if (error) throw error;

      setCategories(categories.map(c => c.id === selectedCategory.id ? data : c));
      setIsEditDialogOpen(false);
      setSelectedCategory(null);
      resetForm();
      toast.success(language === 'en' ? 'Category updated successfully' : 'تم تحديث الفئة بنجاح');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'en' 
      ? 'Are you sure? This will affect all items in this category.' 
      : 'هل أنت متأكد؟ سيؤثر هذا على جميع العناصر في هذه الفئة.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('canteen_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCategories(categories.filter(c => c.id !== id));
      toast.success(language === 'en' ? 'Category deleted successfully' : 'تم حذف الفئة بنجاح');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      name_ar: category.name_ar || '',
      icon: category.icon,
      color: category.color,
      is_active: category.is_active
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      name_ar: '',
      icon: '📦',
      color: 'hsl(var(--primary))',
      is_active: true
    });
  };

  const commonIcons = ['🍽️', '☕', '🍎', '🍪', '🍿', '🍕', '🥗', '🍔', '🌮', '🍜', '🍰', '🥤', '🧃', '🍦', '🥪'];

  const CategoryForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{language === 'en' ? 'Name (English)' : 'الاسم (الإنجليزية)'}</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={language === 'en' ? 'Category name' : 'اسم الفئة'}
          />
        </div>
        <div>
          <Label>{language === 'en' ? 'Name (Arabic)' : 'الاسم (العربية)'}</Label>
          <Input
            value={formData.name_ar}
            onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
            placeholder={language === 'en' ? 'Arabic name' : 'الاسم بالعربية'}
            dir="rtl"
          />
        </div>
      </div>

      <div>
        <Label>{language === 'en' ? 'Icon' : 'الأيقونة'}</Label>
        <div className="grid grid-cols-8 gap-2 mt-2">
          {commonIcons.map(icon => (
            <Button
              key={icon}
              type="button"
              variant={formData.icon === icon ? 'default' : 'outline'}
              className="text-2xl h-12"
              onClick={() => setFormData({ ...formData, icon })}
            >
              {icon}
            </Button>
          ))}
        </div>
        <Input
          value={formData.icon}
          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
          placeholder="Or type custom emoji"
          className="mt-2"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>{language === 'en' ? 'Active' : 'نشط'}</Label>
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
      </div>
    </div>
  );

  if (loading) return <LogoLoader />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Tag className="h-6 w-6" />
                {language === 'en' ? 'Category Management' : 'إدارة الفئات'}
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {language === 'en' 
                  ? 'Organize your canteen items by categories' 
                  : 'نظم عناصر المقصف حسب الفئات'}
              </p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Add Category' : 'إضافة فئة'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>{language === 'en' ? 'Icon' : 'الأيقونة'}</TableHead>
                <TableHead>{language === 'en' ? 'Name' : 'الاسم'}</TableHead>
                <TableHead>{language === 'en' ? 'Status' : 'الحالة'}</TableHead>
                <TableHead className="text-right">{language === 'en' ? 'Actions' : 'الإجراءات'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  </TableCell>
                  <TableCell>
                    <span className="text-2xl">{category.icon}</span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{category.name}</p>
                      {category.name_ar && (
                        <p className="text-sm text-muted-foreground" dir="rtl">
                          {category.name_ar}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.is_active ? 'default' : 'secondary'}>
                      {category.is_active 
                        ? (language === 'en' ? 'Active' : 'نشط')
                        : (language === 'en' ? 'Inactive' : 'غير نشط')
                      }
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(category.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Add Category' : 'إضافة فئة'}
            </DialogTitle>
          </DialogHeader>
          <CategoryForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {language === 'en' ? 'Cancel' : 'إلغاء'}
            </Button>
            <Button onClick={handleAdd}>
              {language === 'en' ? 'Add' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Edit Category' : 'تعديل الفئة'}
            </DialogTitle>
          </DialogHeader>
          <CategoryForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {language === 'en' ? 'Cancel' : 'إلغاء'}
            </Button>
            <Button onClick={handleEdit}>
              {language === 'en' ? 'Save' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
