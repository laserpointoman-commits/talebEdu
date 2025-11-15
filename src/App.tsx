import React, { Suspense } from "react";
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
import PageTransition from "@/components/PageTransition";
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
// Removed test page

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
                  <StudentsProvider>
                    <PageTransition>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/register" element={<ParentSelfSignup />} />
                        <Route path="/email-confirmation-pending" element={<EmailConfirmationPending />} />
                        <Route path="/parent-registration" element={<ParentRegistration />} />
                        <Route path="/register-student" element={<RegisterStudent />} />
                        <Route path="/dashboard/register-student" element={<StudentRegistrationWizard />} />
                        <Route path="/admin/parent-invitations" element={<ParentInvitationsDashboard />} />
                        <Route path="/admin/student-approvals" element={<StudentApprovalDashboard />} />
                        <Route path="/dashboard/*" element={<Dashboard />} />
                        <Route path="/create-admin" element={<CreateAdmin />} />
                        {/* Test page removed */}
                        <Route path="/nfc-kiosk" element={<NFCKiosk />} />
                        <Route path="/checkpoint" element={<EntranceCheckpoint />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </PageTransition>
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