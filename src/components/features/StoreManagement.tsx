import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAsyncLoading } from '@/hooks/use-async-loading';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import LogoLoader from '@/components/LogoLoader';
import { toast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  name_ar: string | null;
  category: 'textbooks' | 'uniforms' | 'supplies';
  price: number;
  image: string | null;
  description: string | null;
  description_ar: string | null;
  sizes: string[] | null;
  in_stock: boolean;
  stock_quantity: number;
}

export default function StoreManagement() {
  const { language } = useLanguage();
  const { executeAsync } = useAsyncLoading('store-management');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'textbooks' | 'uniforms' | 'supplies'>('all');
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    name_ar: '',
    category: 'textbooks',
    price: 0,
    image: '',
    description: '',
    description_ar: '',
    sizes: [],
    in_stock: true,
    stock_quantity: 0
  });

  useEffect(() => {
    executeAsync(async () => {
      await fetchProducts();
    });
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts((data || []) as Product[]);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const handleAdd = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: formData.name || '',
          name_ar: formData.name_ar || null,
          category: formData.category as 'textbooks' | 'uniforms' | 'supplies',
          price: formData.price || 0,
          image: formData.image || null,
          description: formData.description || null,
          description_ar: formData.description_ar || null,
          sizes: formData.sizes || null,
          in_stock: formData.in_stock !== false,
          stock_quantity: formData.stock_quantity || 0
        }])
        .select()
        .single();

      if (error) throw error;

      setProducts([data as Product, ...products]);
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: language === 'ar' ? 'تمت إضافة المنتج' : 'Product Added',
        description: language === 'ar' ? 'تم إضافة المنتج بنجاح' : 'Product has been added successfully',
      });
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleEdit = async () => {
    if (!selectedProduct) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          name: formData.name,
          name_ar: formData.name_ar,
          category: formData.category,
          price: formData.price,
          image: formData.image,
          description: formData.description,
          description_ar: formData.description_ar,
          sizes: formData.sizes,
          in_stock: formData.in_stock,
          stock_quantity: formData.stock_quantity
        })
        .eq('id', selectedProduct.id)
        .select()
        .single();

      if (error) throw error;

      setProducts(products.map(p => p.id === selectedProduct.id ? (data as Product) : p));
      setIsEditDialogOpen(false);
      resetForm();
      toast({
        title: language === 'ar' ? 'تم تحديث المنتج' : 'Product Updated',
        description: language === 'ar' ? 'تم تحديث المنتج بنجاح' : 'Product has been updated successfully',
      });
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== id));
      toast({
        title: language === 'ar' ? 'تم حذف المنتج' : 'Product Deleted',
        description: language === 'ar' ? 'تم حذف المنتج بنجاح' : 'Product has been deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData(product);
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      name_ar: '',
      category: 'textbooks',
      price: 0,
      image: '',
      description: '',
      description_ar: '',
      sizes: [],
      in_stock: true,
      stock_quantity: 0
    });
    setSelectedProduct(null);
  };

  const ProductForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">{language === 'en' ? 'Product Name (English)' : 'اسم المنتج (الإنجليزية)'}</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={language === 'en' ? "Enter product name" : "أدخل اسم المنتج"}
          />
        </div>
        <div>
          <Label htmlFor="nameAr">{language === 'en' ? 'Product Name (Arabic)' : 'اسم المنتج (العربية)'}</Label>
          <Input
            id="nameAr"
            value={formData.name_ar || ''}
            onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
            placeholder="أدخل اسم المنتج"
            dir="rtl"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">{language === 'en' ? 'Category' : 'الفئة'}</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="textbooks">{language === 'en' ? 'Textbooks' : 'الكتب المدرسية'}</SelectItem>
              <SelectItem value="uniforms">{language === 'en' ? 'Uniforms' : 'الزي المدرسي'}</SelectItem>
              <SelectItem value="supplies">{language === 'en' ? 'School Supplies' : 'اللوازم المدرسية'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="price">{language === 'en' ? 'Price (OMR)' : 'السعر (ريال عماني)'}</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="image">Image URL</Label>
        <Input
          id="image"
          value={formData.image}
          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="description">{language === 'en' ? 'Description (English)' : 'الوصف (الإنجليزية)'}</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={language === 'en' ? "Enter product description" : "أدخل وصف المنتج"}
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="descriptionAr">{language === 'en' ? 'Description (Arabic)' : 'الوصف (العربية)'}</Label>
          <Textarea
            id="descriptionAr"
            value={formData.description_ar || ''}
            onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
            placeholder="أدخل وصف المنتج"
            dir="rtl"
            rows={3}
          />
        </div>
      </div>

      {formData.category === 'uniforms' && (
        <div>
          <Label htmlFor="sizes">Sizes (comma separated)</Label>
          <Input
            id="sizes"
            value={formData.sizes?.join(', ')}
            onChange={(e) => setFormData({ 
              ...formData, 
              sizes: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
            })}
            placeholder="S, M, L, XL"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="stockQuantity">Stock Quantity</Label>
          <Input
            id="stockQuantity"
            type="number"
            value={formData.stock_quantity}
            onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
            placeholder="0"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="inStock"
            checked={formData.in_stock}
            onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })}
          />
          <Label htmlFor="inStock">In Stock</Label>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {language === 'ar' ? 'إدارة المتجر' : 'Store Management'}
            </CardTitle>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'إضافة منتج' : 'Add Product'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <TabsList className={`grid w-full grid-cols-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <TabsTrigger value="all">
                {language === 'ar' ? 'الكل' : 'All'} ({products.length})
              </TabsTrigger>
              <TabsTrigger value="textbooks">
                {language === 'ar' ? 'الكتب' : 'Textbooks'} ({products.filter(p => p.category === 'textbooks').length})
              </TabsTrigger>
              <TabsTrigger value="uniforms">
                {language === 'ar' ? 'الزي' : 'Uniforms'} ({products.filter(p => p.category === 'uniforms').length})
              </TabsTrigger>
              <TabsTrigger value="supplies">
                {language === 'ar' ? 'اللوازم' : 'Supplies'} ({products.filter(p => p.category === 'supplies').length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={selectedCategory} className="mt-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <LogoLoader />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'ar' ? 'الصورة' : 'Image'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الفئة' : 'Category'}</TableHead>
                      <TableHead>{language === 'ar' ? 'السعر' : 'Price'}</TableHead>
                      <TableHead>{language === 'ar' ? 'المخزون' : 'Stock'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead className="text-right">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <img 
                          src={product.image || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400'} 
                          alt={language === 'ar' ? product.name_ar || product.name : product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {language === 'ar' ? product.name_ar || product.name : product.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {product.category === 'textbooks' && (language === 'ar' ? 'كتب' : 'Textbooks')}
                          {product.category === 'uniforms' && (language === 'ar' ? 'زي مدرسي' : 'Uniforms')}
                          {product.category === 'supplies' && (language === 'ar' ? 'لوازم' : 'Supplies')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {language === 'ar' ? `${Number(product.price).toFixed(2)} ر.ع` : `OMR ${Number(product.price).toFixed(2)}`}
                      </TableCell>
                      <TableCell>{product.stock_quantity}</TableCell>
                      <TableCell>
                        <Badge variant={product.in_stock ? 'default' : 'destructive'}>
                          {product.in_stock 
                            ? (language === 'ar' ? 'متوفر' : 'In Stock')
                            : (language === 'ar' ? 'غير متوفر' : 'Out of Stock')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            size="icon" 
                            variant="outline"
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="outline"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <ProductForm />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleAdd}>
              {language === 'ar' ? 'إضافة' : 'Add'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تعديل المنتج' : 'Edit Product'}</DialogTitle>
          </DialogHeader>
          <ProductForm />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleEdit}>
              {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}