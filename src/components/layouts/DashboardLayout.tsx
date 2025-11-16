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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import Footer from './Footer';
import FloatingChat from '@/components/chat/FloatingChat';

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
  
  // Check if we're on the mobile messaging page
  const isOnMobileMessaging = isMobile && location.pathname === '/dashboard/social/friends';
  
  // Check if developer is testing a role
  const isDeveloper = profile?.role === 'developer';
  const currentTestRole = isDeveloper ? sessionStorage.getItem('developerViewRole') : null;
  
  // Check if kiosk mode (attendance devices)
  const isKioskMode = profile?.role === 'school_attendance' || profile?.role === 'bus_attendance';
  
  // If kiosk mode, render without layout wrapper
  if (isKioskMode) {
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
      {/* Top Bar - Mobile optimized with centered logo */}
      <header 
        className="fixed left-0 right-0 top-0 h-12 md:h-16 border-b border-border/40 bg-background/95 backdrop-blur-sm flex items-center justify-between px-1 md:px-6 z-50"
      >
        {/* Left Section - Menu, Home, Language */}
        <div className="flex items-center gap-0.5 md:gap-2 w-[120px] md:w-[180px]">
          {/* Desktop Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden lg:flex h-9 w-9"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? <X className="h-6 w-6 md:h-7 md:w-7" /> : <Menu className="h-6 w-6 md:h-7 md:w-7" />}
          </Button>

          {/* Mobile Sidebar */}
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-7 w-7"
                aria-label="Toggle mobile sidebar"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side={dir === 'rtl' ? 'right' : 'left'} className="p-0 w-[280px] max-w-[85vw]">
              <Sidebar onItemClick={() => setIsMobileSidebarOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Home Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="h-7 w-7 md:h-9 md:w-9"
            aria-label="Go to home"
          >
            <Home className="h-6 w-6 md:h-7 md:w-7" />
          </Button>
          
          {/* Language Switcher - Mobile scale */}
          <div className="scale-[0.85] md:scale-100 origin-left">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Center Section - App Logo and Name - Always LTR */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-3 md:gap-4" dir="ltr">
          <div className="relative">
            <div className="text-4xl md:text-6xl font-bold text-primary leading-none">
              t
            </div>
            <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full opacity-50 hidden md:block" />
          </div>
          <span className="font-semibold text-2xl md:text-3xl text-foreground">
            talebEdu
          </span>
        </div>

        {/* Right Section - Mobile optimized */}
        <div className="flex items-center gap-1 md:gap-2 w-[120px] md:w-[180px] justify-end">
          {/* Role Switcher for Developer Testing Mode - Mobile optimized */}
          {isDeveloper && currentTestRole && (
            <div className={`flex items-center gap-0.5 md:gap-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
              <Badge variant="secondary" className="text-[8px] md:text-xs px-0.5 md:px-2 hidden sm:inline-flex">
                {language === 'ar' ? 'وضع الاختبار' : 'Testing Mode'}
              </Badge>
              <Select value={currentTestRole} onValueChange={handleRoleSwitch}>
                <SelectTrigger className="w-[100px] md:w-[180px] h-7 md:h-9 text-[10px] md:text-sm">
                  <SelectValue>
                    {(() => {
                      const currentRole = roles.find(r => r.value === currentTestRole);
                      if (currentRole) {
                        const Icon = currentRole.icon;
                        return (
                          <div className={`flex items-center gap-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                            <Icon className={`h-4 w-4 ${currentRole.color}`} />
                            <span>{currentRole.label}</span>
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

          {/* User Account Menu - Mobile optimized */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-7 w-7 md:h-10 md:w-10 rounded-full">
                <Avatar className="h-7 w-7 md:h-10 md:w-10">
                  <AvatarFallback className="bg-gradient-primary text-white">
                    <User className="h-5 w-5 md:h-7 md:w-7" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 md:w-56 bg-background" align={dir === 'rtl' ? 'start' : 'end'} forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.full_name || user?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard/profile" className={`flex cursor-pointer ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  <User className={`h-6 w-6 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                  <span>{t('dashboard.profile')}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard/settings" className={`flex cursor-pointer ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  <Settings className={`h-6 w-6 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                  <span>{t('dashboard.settings')}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className={`text-destructive ${dir === 'rtl' ? 'flex flex-row-reverse' : ''}`}>
                <LogOut className={`h-6 w-6 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                <span>{t('auth.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main layout - fixed padding for header - Mobile optimized */}
      <div 
        className="flex h-screen pt-12 md:pt-16"
      >
        {/* Desktop Sidebar */}
        <div className={cn(
          "hidden lg:block transition-all duration-300 overflow-hidden",
          isSidebarOpen ? "w-64" : "w-0"
        )}>
          <div className="h-full overflow-y-auto">
            <Sidebar />
          </div>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Content - with footer at the bottom - Mobile optimized padding */}
          <main className="flex-1 overflow-y-auto bg-muted/10">
            <div className={cn(
              "flex flex-col h-full",
              isMobile ? "px-2" : "px-4 py-4"
            )}>
              <div className="flex-1">
                {children}
              </div>
              <Footer />
            </div>
          </main>
        </div>
      </div>
      
      {/* Floating Chat Window */}
      <FloatingChat />
    </div>
  );
}

// Default export
export default DashboardLayout;

// Named export for compatibility
export { DashboardLayout };