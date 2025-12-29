import { ReactNode, useState, useEffect, useRef } from 'react';
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
import { LogOut, User, Settings, Menu, X, Home, Shield, School, Users, GraduationCap, Car } from 'lucide-react';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
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
  
  // Check if we're on the Messenger page (full-screen experience on mobile)
  const isMessengerPage = location.pathname === '/dashboard/messages';
  const isFullScreenMobile = isMobile && isMessengerPage;
  
  // Check if developer is testing a role
  const isDeveloper = profile?.role === 'developer';
  const currentTestRole = isDeveloper ? sessionStorage.getItem('developerViewRole') : null;
  
  // Check if kiosk mode (attendance devices)
  const isKioskMode = profile?.role === 'school_attendance' || profile?.role === 'bus_attendance';
  
  // If kiosk mode or full-screen mobile messenger, render without layout wrapper
  if (isKioskMode || isFullScreenMobile) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }
  
  const roles = [
    { 
      value: 'admin', 
      label: language === 'ar' ? 'المسؤول' : 'Administrator',
      icon: Shield,
      color: 'text-red-600'
    },
    { 
      value: 'teacher', 
      label: language === 'ar' ? 'المعلم' : 'Teacher',
      icon: School,
      color: 'text-blue-600'
    },
    { 
      value: 'parent', 
      label: language === 'ar' ? 'ولي الأمر' : 'Parent',
      icon: Users,
      color: 'text-green-600'
    },
    { 
      value: 'student', 
      label: language === 'ar' ? 'الطالب' : 'Student',
      icon: GraduationCap,
      color: 'text-purple-600'
    },
    { 
      value: 'driver', 
      label: language === 'ar' ? 'السائق' : 'Driver',
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



  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Top Bar - iOS Safe Area Aware */}
      <header 
        className="fixed left-0 right-0 top-0 z-50 ios-header"
      >
        <div className="h-16 md:h-20 border-b border-border/40 bg-background/95 backdrop-blur-sm flex items-center justify-between px-3 md:px-6">

        {/* Left Section - Menu, Home, Language */}
        <div className="flex items-center gap-2 md:gap-3 w-auto">
          {/* Desktop Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden lg:flex h-10 w-10 md:h-11 md:w-11"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>

          {/* Mobile Sidebar */}
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-10 w-10"
                aria-label="Toggle mobile sidebar"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side={dir === 'rtl' ? 'right' : 'left'} 
              className="p-0 w-[300px] max-w-[90vw] pt-0"
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
            className="h-10 w-10 md:h-11 md:w-11"
            aria-label="Go to home"
          >
            <Home className="h-6 w-6" />
          </Button>
          
          {/* Language Switcher */}
          <LanguageSwitcher />
        </div>

        {/* Right Section - Logo and User Menu */}
        <div className="flex items-center gap-2 md:gap-4 w-auto justify-end">
          {/* App Logo and Name - Always LTR */}
          <div className="flex items-center justify-center gap-2 md:gap-3" dir="ltr">
            <div className="relative">
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary leading-none">
                t
              </div>
              <div className="absolute -inset-3 bg-primary/20 blur-xl rounded-full opacity-50 hidden md:block" />
            </div>
            <span className="font-semibold text-xl md:text-2xl lg:text-3xl text-foreground">
              talebEdu
            </span>
          </div>
          {/* Role Switcher for Developer Testing Mode */}
          {isDeveloper && currentTestRole && (
            <div className={`flex items-center gap-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
              <Badge variant="secondary" className="text-xs px-2 hidden sm:inline-flex">
                {language === 'ar' ? 'وضع الاختبار' : 'Testing'}
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
                      <span>{language === 'ar' ? 'العودة للمطور' : 'Back to Developer'}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* User Account Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 md:h-11 md:w-11 rounded-full">
                <Avatar className="h-10 w-10 md:h-11 md:w-11">
                  <AvatarFallback className="bg-gradient-primary text-white">
                    <User className="h-6 w-6" />
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

      {/* Main layout - iOS Safe Area Aware */}
      <div 
        className="flex h-screen"
        style={{ 
          paddingTop: 'calc(4rem + env(safe-area-inset-top, 0px))',
        }}
      >
        {/* Desktop Sidebar - Wider for better readability */}
        <div className={cn(
          "hidden lg:block transition-all duration-300 overflow-hidden",
          isSidebarOpen ? "w-72" : "w-0"
        )}>
          <div className="h-full overflow-y-auto">
            <Sidebar />
          </div>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Content - iOS Safe Area Aware with proper bottom padding for nav */}
          <main 
            className="flex-1 overflow-y-auto bg-muted/10"
            style={{
              paddingBottom: isMobile ? 'calc(6.5rem + env(safe-area-inset-bottom, 0px))' : 'env(safe-area-inset-bottom, 0px)'
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
      </div>
      
      {/* Bottom Navigation for Mobile */}
      <BottomNavigation />
    </div>
  );
}

// Default export
export default DashboardLayout;

// Named export for compatibility
export { DashboardLayout };