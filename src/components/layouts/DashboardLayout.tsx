import { ReactNode, useRef, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Settings, Menu, X, Home, Shield, School, Users, GraduationCap, Car, ArrowLeft } from 'lucide-react';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { usePreventIOSScrollBounce } from '@/hooks/use-ios-scroll-bounce';
import Footer from './Footer';

interface DashboardLayoutProps {
  children: ReactNode;
}

function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, profile, logout } = useAuth();
  const { t, dir, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const mainScrollRef = useRef<HTMLElement | null>(null);
  usePreventIOSScrollBounce(mainScrollRef);
  const isMessengerPage = location.pathname === '/dashboard/messages';
  const isFullScreenMobile = isMobile && isMessengerPage;
  
  // Check if developer is testing a role
  const isDeveloper = profile?.role === 'developer';
  const currentTestRole = isDeveloper ? sessionStorage.getItem('developerViewRole') : null;
  
  // Check if kiosk mode (attendance devices)
  const isKioskMode = profile?.role === 'school_attendance' || profile?.role === 'bus_attendance';

  // Supervisor dashboard should be a focused, single-purpose experience on mobile
  const isSupervisorMode = profile?.role === 'supervisor';
  const showBottomNav = isMobile && !isSupervisorMode;
  
  // If kiosk mode or full-screen mobile messenger, render without layout wrapper
  if (isKioskMode || isFullScreenMobile) {
    return <div className="fixed inset-0 bg-background overflow-hidden">{children}</div>;
  }
  
  // Helper for trilingual text
  const getText = (en: string, ar: string, hi: string) => {
    if (language === 'ar') return ar;
    if (language === 'hi') return hi;
    return en;
  };

  const roles = [
    { 
      value: 'admin', 
      label: getText('Administrator', 'المسؤول', 'प्रशासक'),
      icon: Shield,
      color: 'text-red-600'
    },
    { 
      value: 'teacher', 
      label: getText('Teacher', 'المعلم', 'शिक्षक'),
      icon: School,
      color: 'text-blue-600'
    },
    { 
      value: 'parent', 
      label: getText('Parent', 'ولي الأمر', 'अभिभावक'),
      icon: Users,
      color: 'text-green-600'
    },
    { 
      value: 'student', 
      label: getText('Student', 'الطالب', 'छात्र'),
      icon: GraduationCap,
      color: 'text-purple-600'
    },
    { 
      value: 'driver', 
      label: getText('Driver', 'السائق', 'चालक'),
      icon: Car,
      color: 'text-orange-600'
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const handleRoleSwitch = (role: string) => {
    if (role === 'developer') {
      sessionStorage.removeItem('developerViewRole');
    } else {
      sessionStorage.setItem('developerViewRole', role);
    }
    window.location.reload();
  };




  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      {/* Top Bar - iOS Safe Area Aware - Always LTR - Fixed with solid background */}
      <header 
        className="fixed left-0 right-0 top-0 z-50 bg-sky-100"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        dir="ltr"
      >
        <div className="h-12 md:h-14 border-b border-sky-200 bg-sky-100 shadow-sm flex items-center justify-between px-2 md:px-6">

        {/* Left Section - Back/Menu, Home, Language */}
        <div className="flex items-center gap-1.5 md:gap-3 w-auto">
          {/* Back Button - Show on ALL pages */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8 md:h-9 md:w-9 rounded-lg hover:bg-secondary"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          {/* Desktop Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden lg:flex h-8 w-8 md:h-9 md:w-9 rounded-lg hover:bg-secondary"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? <X className="h-4 w-4 md:h-5 md:w-5" /> : <Menu className="h-4 w-4 md:h-5 md:w-5" />}
          </Button>

          {/* Mobile Sidebar */}
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8 rounded-lg hover:bg-secondary"
                aria-label="Toggle mobile sidebar"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side={dir === 'rtl' ? 'right' : 'left'} 
              className="p-0 w-[300px] max-w-[90vw] pt-0 bg-card border-border"
              style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
              <Sidebar onItemClick={() => setIsMobileSidebarOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Home Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="h-8 w-8 md:h-9 md:w-9 rounded-lg hover:bg-secondary"
            aria-label="Go to home"
          >
            <Home className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          
          {/* Language Switcher */}
          <LanguageSwitcher />
        </div>

        {/* Right Section - Logo and User Menu */}
        <div className="flex items-center gap-2 md:gap-3 w-auto justify-end">
          {/* App Logo and Name - Always LTR */}
          <div className="flex items-center justify-center gap-1.5 md:gap-2" dir="ltr">
            <div className="relative">
              <div className="text-2xl md:text-3xl font-bold text-primary leading-none">
                t
              </div>
            </div>
            <span className="font-bold text-base md:text-lg text-foreground">
              talebEdu
            </span>
          </div>
          {/* Role Switcher for Developer Testing Mode */}
          {isDeveloper && currentTestRole && (
            <div className={`flex items-center gap-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
              <Badge variant="secondary" className="text-xs px-2 hidden sm:inline-flex">
                {getText('Testing', 'وضع الاختبار', 'परीक्षण')}
              </Badge>
              <Select value={currentTestRole} onValueChange={handleRoleSwitch}>
                <SelectTrigger className="w-[140px] md:w-[180px] h-9 md:h-10 text-sm">
                  <SelectValue>
                    {(() => {
                      const currentRole = roles.find(r => r.value === currentTestRole);
                      if (currentRole) {
                        const Icon = currentRole.icon;
                        return (
                          <div className={`flex items-center gap-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                            <Icon className={`h-4 w-4 ${currentRole.color}`} />
                            <span className="truncate">{currentRole.label}</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => {
                    const Icon = role.icon;
                    return (
                      <SelectItem key={role.value} value={role.value}>
                        <div className={`flex items-center gap-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                          <Icon className={`h-4 w-4 ${role.color}`} />
                          <span>{role.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                  <SelectItem value="developer">
                    <div className={`flex items-center gap-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                      <Shield className="h-4 w-4 text-indigo-600" />
                      <span>{getText('Back to Developer', 'العودة للمطور', 'डेवलपर पर वापस जाएं')}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* User Account Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 md:h-9 md:w-9 rounded-lg hover:bg-secondary">
                <Avatar className="h-7 w-7 md:h-8 md:w-8 rounded-lg">
                  <AvatarFallback className="bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                    <User className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-background" align={dir === 'rtl' ? 'start' : 'end'} forceMount>
              <DropdownMenuLabel className="font-normal py-3">
                <div className="flex flex-col space-y-1.5">
                  <p className="text-base font-medium leading-none">{profile?.full_name || user?.email}</p>
                  <p className="text-sm leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="py-3">
                <Link to="/dashboard/profile" className={`flex cursor-pointer ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  <User className={`h-5 w-5 ${dir === 'rtl' ? 'ml-3' : 'mr-3'}`} />
                  <span className="text-base">{t('dashboard.profile')}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="py-3">
                <Link to="/dashboard/settings" className={`flex cursor-pointer ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  <Settings className={`h-5 w-5 ${dir === 'rtl' ? 'ml-3' : 'mr-3'}`} />
                  <span className="text-base">{t('dashboard.settings')}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className={`text-destructive py-3 ${dir === 'rtl' ? 'flex flex-row-reverse' : ''}`}>
                <LogOut className={`h-5 w-5 ${dir === 'rtl' ? 'ml-3' : 'mr-3'}`} />
                <span className="text-base">{t('auth.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        </div>
      </header>

      {/* Spacer for fixed header - matches header height + safe area */}
      <div 
        className="shrink-0 h-12 md:h-14"
        style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
      />

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar - Wider for better readability */}
        <div className={cn(
          "hidden lg:block transition-all duration-300 shrink-0 overflow-hidden",
          isSidebarOpen ? "w-72" : "w-0"
        )}>
          <div className="h-full overflow-y-auto">
            <Sidebar />
          </div>
        </div>
        
        {/* Main Content */}
        <main 
          ref={mainScrollRef}
          className="flex-1 overflow-y-auto overscroll-none bg-muted/10"
          style={{
            paddingBottom: showBottomNav
              ? 'calc(3.5rem + env(safe-area-inset-bottom, 0px))'
              : '0',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
        >
          <div className={cn(
            "flex flex-col min-h-full",
            isMobile ? "px-3 py-4" : "px-6 py-6"
          )}>
            <div className="flex-1">
              {children}
            </div>
            <Footer />
          </div>
        </main>
      </div>

      {/* Bottom Navigation for Mobile - Fixed */}
      {showBottomNav && <BottomNavigation />}
    </div>
  );
}

// Default export
export default DashboardLayout;

// Named export for compatibility
export { DashboardLayout };