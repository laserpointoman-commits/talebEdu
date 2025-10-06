import { useState, useEffect } from 'react';
import LogoLoader from '@/components/LogoLoader';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingBag, Plus, Edit, Trash2, Package, Info, Tag, TrendingUp, AlertTriangle, Barcode
} from 'lucide-react';
import { toast } from 'sonner';
import CategoryManagement from './CategoryManagement';

interface CanteenItem {
  id: string;
  name: string;
  name_ar: string | null;
  category: string;
  price: number;
  available: boolean;
  icon: string;
  stock_quantity: number;
  low_stock_alert: number;
  cost_price: number;
  barcode: string | null;
  created_at?: string;
  updated_at?: string;
}

interface Category {
  id: string;
  name: string;
  name_ar: string | null;
  icon: string;
  display_order: number;
  is_active: boolean;
}

export default function CanteenManagement() {
  const { language } = useLanguage();
  const [items, setItems] = useState<CanteenItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('items');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CanteenItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    category: '',
    price: 0,
    cost_price: 0,
    available: true,
    icon: '🍽️',
    stock_quantity: 0,
    low_stock_alert: 10,
    barcode: ''
  });

  useEffect(() => {
    fetchCategories();
    fetchItems();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('canteen_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
      
      // Set default category for form
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, category: data[0].name }));
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('canteen_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching canteen items:', error);
      toast.error(language === 'en' ? 'Failed to load items' : 'فشل تحميل العناصر');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  const handleAdd = async () => {
    if (!formData.name || !formData.category || formData.price <= 0) {
      toast.error(
        language === 'en' 
          ? 'Please fill in all required fields' 
          : 'الرجاء ملء جميع الحقول المطلوبة'
      );
      return;
    }

    try {
      const { data, error } = await supabase
        .from('canteen_items')
        .insert([{
          name: formData.name,
          name_ar: formData.name_ar || null,
          category: formData.category,
          price: formData.price,
          cost_price: formData.cost_price,
          available: formData.available,
          icon: formData.icon,
          stock_quantity: formData.stock_quantity,
          low_stock_alert: formData.low_stock_alert,
          barcode: formData.barcode || null
        }])
        .select()
        .single();

      if (error) throw error;

      setItems([data, ...items]);
      setIsAddDialogOpen(false);
      resetForm();
      toast.success(language === 'en' ? 'Item added successfully' : 'تمت إضافة العنصر بنجاح');
    } catch (error: any) {
      console.error('Error adding item:', error);
      toast.error(error.message);
    }
  };

  const handleEdit = async () => {
    if (!selectedItem || !formData.name || !formData.category || formData.price <= 0) {
      toast.error(
        language === 'en' 
          ? 'Please fill in all required fields' 
          : 'الرجاء ملء جميع الحقول المطلوبة'
      );
      return;
    }

    try {
      const { data, error } = await supabase
        .from('canteen_items')
        .update({
          name: formData.name,
          name_ar: formData.name_ar || null,
          category: formData.category,
          price: formData.price,
          cost_price: formData.cost_price,
          available: formData.available,
          icon: formData.icon,
          stock_quantity: formData.stock_quantity,
          low_stock_alert: formData.low_stock_alert,
          barcode: formData.barcode || null
        })
        .eq('id', selectedItem.id)
        .select()
        .single();

      if (error) throw error;

      setItems(items.map(item => item.id === selectedItem.id ? data : item));
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      resetForm();
      toast.success(language === 'en' ? 'Item updated successfully' : 'تم تحديث العنصر بنجاح');
    } catch (error: any) {
      console.error('Error updating item:', error);
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'en' 
      ? 'Are you sure you want to delete this item?' 
      : 'هل أنت متأكد من أنك تريد حذف هذا العنصر؟')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('canteen_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItems(items.filter(item => item.id !== id));
      toast.success(language === 'en' ? 'Item deleted successfully' : 'تم حذف العنصر بنجاح');
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast.error(error.message);
    }
  };

  const openEditDialog = (item: CanteenItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      name_ar: item.name_ar || '',
      category: item.category,
      price: item.price,
      cost_price: item.cost_price,
      available: item.available,
      icon: item.icon,
      stock_quantity: item.stock_quantity,
      low_stock_alert: item.low_stock_alert,
      barcode: item.barcode || ''
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      name_ar: '',
      category: categories[0]?.name || '',
      price: 0,
      cost_price: 0,
      available: true,
      icon: '🍽️',
      stock_quantity: 0,
      low_stock_alert: 10,
      barcode: ''
    });
  };

  const lowStockItems = items.filter(item => item.stock_quantity <= item.low_stock_alert);
  const totalProfit = items.reduce((sum, item) => sum + ((item.price - item.cost_price) * Math.max(0, item.stock_quantity)), 0);

  const ItemForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{language === 'en' ? 'Name (English)' : 'الاسم (الإنجليزية)'}</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={language === 'en' ? 'Item name' : 'اسم العنصر'}
          />
        </div>
        <div>
          <Label>{language === 'en' ? 'Name (Arabic)' : 'الاسم (العربية)'}</Label>
          <Input
            value={formData.name_ar}
            onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
            placeholder={language === 'en' ? 'Item name in Arabic' : 'اسم العنصر بالعربية'}
            dir="rtl"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{language === 'en' ? 'Category' : 'الفئة'}</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.icon} {language === 'en' ? cat.name : cat.name_ar || cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{language === 'en' ? 'Icon' : 'الأيقونة'}</Label>
          <Input
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            placeholder="🍽️"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{language === 'en' ? 'Sale Price (OMR)' : 'سعر البيع (ر.ع)'}</Label>
          <Input
            type="number"
            step="0.001"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label>{language === 'en' ? 'Cost Price (OMR)' : 'سعر التكلفة (ر.ع)'}</Label>
          <Input
            type="number"
            step="0.001"
            min="0"
            value={formData.cost_price}
            onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{language === 'en' ? 'Stock Quantity' : 'الكمية'}</Label>
          <Input
            type="number"
            min="0"
            value={formData.stock_quantity}
            onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label>{language === 'en' ? 'Low Stock Alert' : 'تنبيه انخفاض المخزون'}</Label>
          <Input
            type="number"
            min="0"
            value={formData.low_stock_alert}
            onChange={(e) => setFormData({ ...formData, low_stock_alert: parseInt(e.target.value) || 10 })}
          />
        </div>
      </div>

      <div>
        <Label>{language === 'en' ? 'Barcode (Optional)' : 'الباركود (اختياري)'}</Label>
        <Input
          value={formData.barcode}
          onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
          placeholder="1234567890"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>{language === 'en' ? 'Available' : 'متوفر'}</Label>
        <Switch
          checked={formData.available}
          onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
        />
      </div>
    </div>
  );

  if (loading) {
    return <LogoLoader size="medium" text={true} fullScreen={true} />;
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="items">
            <Package className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Items' : 'العناصر'}
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Tag className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Categories' : 'الفئات'}
          </TabsTrigger>
        </TabsList>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-6 mt-6">
          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'en' ? 'Total Items' : 'إجمالي العناصر'}
                    </p>
                    <p className="text-2xl font-bold">{items.length}</p>
                  </div>
                  <Package className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'en' ? 'Available' : 'متوفر'}
                    </p>
                    <p className="text-2xl font-bold text-success">
                      {items.filter(item => item.available).length}
                    </p>
                  </div>
                  <Info className="h-8 w-8 text-success/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'en' ? 'Low Stock' : 'مخزون منخفض'}
                    </p>
                    <p className="text-2xl font-bold text-destructive">
                      {lowStockItems.length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-destructive/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'en' ? 'Estimated Profit' : 'الربح المتوقع'}
                    </p>
                    <p className="text-2xl font-bold text-success">
                      {totalProfit.toFixed(3)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-success/20" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <ShoppingBag className="h-6 w-6" />
                    {language === 'en' ? 'Items Management' : 'إدارة العناصر'}
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    {language === 'en' 
                      ? 'Manage canteen items, prices, stock, and availability' 
                      : 'إدارة عناصر المقصف والأسعار والمخزون والتوفر'}
                  </p>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {language === 'en' ? 'Add Item' : 'إضافة عنصر'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className={`grid w-full ${categories.length > 5 ? 'grid-cols-7' : `grid-cols-${categories.length + 1}`}`}>
                  <TabsTrigger value="all">
                    {language === 'en' ? 'All' : 'الكل'}
                  </TabsTrigger>
                  {categories.map(category => (
                    <TabsTrigger key={category.id} value={category.name}>
                      {category.icon} {language === 'en' ? category.name : category.name_ar || category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value={selectedCategory} className="mt-6">
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {language === 'en' 
                          ? 'No items found' 
                          : 'لا توجد عناصر'}
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{language === 'en' ? 'Item' : 'العنصر'}</TableHead>
                          <TableHead>{language === 'en' ? 'Category' : 'الفئة'}</TableHead>
                          <TableHead>{language === 'en' ? 'Price' : 'السعر'}</TableHead>
                          <TableHead>{language === 'en' ? 'Stock' : 'المخزون'}</TableHead>
                          <TableHead>{language === 'en' ? 'Status' : 'الحالة'}</TableHead>
                          <TableHead className="text-right">{language === 'en' ? 'Actions' : 'الإجراءات'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="text-2xl">{item.icon}</div>
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  {item.name_ar && (
                                    <p className="text-sm text-muted-foreground" dir="rtl">
                                      {item.name_ar}
                                    </p>
                                  )}
                                  {item.barcode && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Barcode className="h-3 w-3" />
                                      {item.barcode}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {categories.find(c => c.name === item.category)?.icon} {item.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <span className="font-medium">
                                  {item.price.toFixed(3)} OMR
                                </span>
                                {item.cost_price > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    {language === 'en' ? 'Cost: ' : 'التكلفة: '}
                                    {item.cost_price.toFixed(3)}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className={item.stock_quantity <= item.low_stock_alert ? 'text-destructive font-bold' : ''}>
                                  {item.stock_quantity}
                                </p>
                                {item.stock_quantity <= item.low_stock_alert && (
                                  <Badge variant="destructive" className="text-xs mt-1">
                                    {language === 'en' ? 'Low' : 'منخفض'}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.available ? 'default' : 'secondary'}>
                                {item.available 
                                  ? (language === 'en' ? 'Available' : 'متوفر')
                                  : (language === 'en' ? 'Out' : 'نفذ')
                                }
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(item)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="mt-6">
          <CategoryManagement />
        </TabsContent>
      </Tabs>

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Add New Item' : 'إضافة عنصر جديد'}
            </DialogTitle>
          </DialogHeader>
          <ItemForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {language === 'en' ? 'Cancel' : 'إلغاء'}
            </Button>
            <Button onClick={handleAdd}>
              {language === 'en' ? 'Add Item' : 'إضافة العنصر'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Edit Item' : 'تعديل العنصر'}
            </DialogTitle>
          </DialogHeader>
          <ItemForm isEdit={true} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {language === 'en' ? 'Cancel' : 'إلغاء'}
            </Button>
            <Button onClick={handleEdit}>
              {language === 'en' ? 'Save Changes' : 'حفظ التغييرات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
