import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ParentFinance from '@/components/dashboards/ParentFinance';
import { Navigate } from 'react-router-dom';

export default function ParentFinancePage() {
  const { profile } = useAuth();
  const { language } = useLanguage();

  // Support developer role testing
  const effectiveRole = profile?.role === 'developer'
    ? (sessionStorage.getItem('developerViewRole') as any) || 'developer'
    : profile?.role;

  // Only allow parents to access this page
  if (effectiveRole !== 'parent') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">
        {language === 'en' ? 'School Finance' : 'المالية المدرسية'}
      </h1>
      <ParentFinance />
    </div>
  );
}