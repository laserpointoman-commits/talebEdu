import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Store from '@/components/features/Store';
import StoreManagement from '@/components/features/StoreManagement';
import { Card } from '@/components/ui/card';
import { Package } from 'lucide-react';

export default function StorePage() {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  
  // Support developer role testing
  const effectiveRole = profile?.role === 'developer'
    ? (sessionStorage.getItem('developerViewRole') as any) || 'developer'
    : profile?.role;
  
  // Show Store Management for admin only
  if (effectiveRole === 'admin') {
    return <StoreManagement />;
  }
  
  // Only show store for parents and students
  if (effectiveRole !== 'parent' && effectiveRole !== 'student') {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="p-8 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            {language === 'en' ? 'Access Restricted' : language === 'hi' ? 'पहुंच प्रतिबंधित' : 'الوصول مقيد'}
          </h3>
          <p className="text-muted-foreground">
            {language === 'en' 
              ? 'This section is available for parents and students only'
              : language === 'hi'
              ? 'यह अनुभाग केवल अभिभावकों और छात्रों के लिए उपलब्ध है'
              : 'هذا القسم متاح للآباء والطلاب فقط'}
          </p>
        </Card>
      </div>
    );
  }
  
  // Show read-only Store for parent and student
  return <Store />;
}