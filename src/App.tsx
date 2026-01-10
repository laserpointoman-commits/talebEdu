import React, { Suspense, useEffect } from "react";
import LogoLoader from "./components/LogoLoader";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { StudentsProvider } from "@/contexts/StudentsContext";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import PageTransition from "@/components/PageTransition";
import InstallPrompt from "@/components/mobile/InstallPrompt";
import NetworkStatus from "@/components/mobile/NetworkStatus";
import BiometricGuard from "@/components/BiometricGuard";
import { PushNotificationService } from "@/services/pushNotifications";
import Index from "./pages/Index";
import Auth from "./pages/Auth/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import NFCKiosk from "./pages/NFCKiosk";
import EntranceCheckpoint from "./pages/checkpoint/EntranceCheckpoint";
import UserManagement from "./pages/admin/UserManagement";
import CreateAdmin from "./pages/CreateAdmin";
import GeneratePhotos from "./pages/admin/GeneratePhotos";
import ParentRegistration from "./pages/ParentRegistration";
import ParentInvitationsDashboard from "./pages/admin/ParentInvitationsDashboard";
import RegisterStudent from "./pages/RegisterStudent";
import ParentSelfSignup from "./pages/ParentSelfSignup";
import EmailConfirmationPending from "./pages/EmailConfirmationPending";
import StudentRegistrationWizard from "./components/parent/StudentRegistrationWizard";
import StudentApprovalDashboard from "./pages/admin/StudentApprovalDashboard";
import Presentation from "./pages/Presentation";
import PresentationFull from "./pages/PresentationFull";
import PresentationFullExpanded from "./pages/PresentationFullExpanded";
import PresentationManual from "./pages/PresentationManual";
import PresentationSales from "./pages/PresentationSales";
import InvestorPresentation from "./pages/InvestorPresentation";
import ScreenshotManager from "./pages/admin/ScreenshotManager";
import DemoRoutes from "./pages/screenshot-demo/DemoRoutes";
import StudentDetails from "./pages/parent/StudentDetails";
import StudentWalletControl from "./pages/parent/StudentWalletControl";
import StudentBusTracking from "./pages/parent/StudentBusTracking";
import DeviceLogin from "./pages/device/DeviceLogin";
import BusAttendanceDevice from "./pages/device/BusAttendanceDevice";
import SchoolAttendanceDevice from "./pages/device/SchoolAttendanceDevice";

// Create a stable QueryClient instance
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  // Create query client inside component but memoized
  const [queryClient] = React.useState(createQueryClient);

  // Initialize push notifications on app startup
  useEffect(() => {
    // Wrap in try/catch to prevent blocking app startup
    PushNotificationService.initialize().catch(error => {
      console.error('Push notification initialization failed:', error);
    });
    
    return () => {
      PushNotificationService.removeAllListeners().catch(error => {
        console.error('Error removing push notification listeners:', error);
      });
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <LoadingProvider>
              <TooltipProvider>
                <Suspense fallback={<LogoLoader size="large" text={true} fullScreen={true} />}>
                  <Toaster />
                  <Sonner />
                  <OfflineIndicator />
                  <InstallPrompt />
                  <NetworkStatus />
                  <StudentsProvider>
                    <BiometricGuard>
                      <PageTransition>
                        <Routes>
                        <Route path="/" element={<Auth />} />
                        <Route path="/landing" element={<Index />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/email-confirmation-pending" element={<EmailConfirmationPending />} />
                        {/* Public parent onboarding */}
                        <Route path="/register" element={<ParentSelfSignup />} />
                        <Route path="/parent-self-signup" element={<ParentSelfSignup />} />
                        <Route path="/parent-registration" element={<ParentRegistration />} />
                        <Route path="/register-student" element={<RegisterStudent />} />
                        <Route path="/dashboard/register-student" element={<StudentRegistrationWizard />} />
                        <Route path="/admin/parent-invitations" element={<ParentInvitationsDashboard />} />
                        <Route path="/admin/student-approvals" element={<StudentApprovalDashboard />} />
                        <Route path="/dashboard/*" element={<Dashboard />} />
                        <Route path="/student/:studentId" element={<StudentDetails />} />
                        <Route path="/student/:studentId/wallet" element={<StudentWalletControl />} />
                        <Route path="/student/:studentId/bus" element={<StudentBusTracking />} />
                        <Route path="/create-admin" element={<CreateAdmin />} />
                        {/* Device Login Pages - No Authentication Required */}
                        <Route path="/device/login" element={<DeviceLogin />} />
                        <Route path="/device/bus-attendance" element={<BusAttendanceDevice />} />
                        <Route path="/device/school-attendance" element={<SchoolAttendanceDevice />} />
                        <Route path="/nfc-kiosk" element={<NFCKiosk />} />
                        <Route path="/checkpoint" element={<EntranceCheckpoint />} />
                        <Route path="/presentation" element={<Presentation />} />
                        <Route path="/presentation-full" element={<PresentationFull />} />
                        <Route path="/presentation-expanded" element={<PresentationFullExpanded />} />
                        <Route path="/presentation-manual" element={<PresentationManual />} />
                        <Route path="/presentation-sales" element={<PresentationSales />} />
                        <Route path="/investor" element={<InvestorPresentation />} />
                        <Route path="/admin/screenshot-manager" element={<ScreenshotManager />} />
                        <Route path="/screenshot-demo/en/*" element={<DemoRoutes language="en" />} />
                        <Route path="/screenshot-demo/ar/*" element={<DemoRoutes language="ar" />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </PageTransition>
                  </BiometricGuard>
                  </StudentsProvider>
                </Suspense>
              </TooltipProvider>
            </LoadingProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;