import { useEffect } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';

// Import all dashboard components
import ParentDashboard from '@/pages/dashboards/ParentDashboard';
import AdminDashboard from '@/pages/dashboards/AdminDashboard';
import TeacherDashboard from '@/pages/dashboards/TeacherDashboard';
import DriverDashboard from '@/pages/dashboards/DriverDashboard';
import CanteenDashboard from '@/pages/dashboards/CanteenDashboard';
import StudentDashboard from '@/components/dashboards/StudentDashboard';
import Tracking from '@/pages/Tracking';
import Wallet from '@/pages/Wallet';
import Canteen from '@/pages/Canteen';
import Grades from '@/pages/Grades';
import ParentFinance from '@/pages/ParentFinance';
import StudentManagement from '@/pages/admin/StudentManagement';
import UserManagement from '@/pages/admin/UserManagement';
import FeeManagement from '@/pages/admin/FeeManagement';
import NFCManagement from '@/pages/admin/NFCManagement';
import RoutesManagement from '@/pages/admin/RoutesManagement';
import BusesManagement from '@/pages/admin/BusesManagement';
import DriversManagement from '@/pages/admin/DriversManagement';
import Finance from '@/pages/Finance';
import Attendance from '@/pages/Attendance';
import StudentRegistrationWizard from '@/components/parent/StudentRegistrationWizard';
import StudentApprovalDashboard from '@/pages/admin/StudentApprovalDashboard';
import ParentInvitationsDashboard from '@/pages/admin/ParentInvitationsDashboard';

// Demo wrapper that auto-logs in as specific user
const DemoWrapper = ({ userId, role, children }: { userId: string; role: string; children: React.ReactNode }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const setupDemo = async () => {
      try {
        // Sign out first
        await supabase.auth.signOut();
        
        // Auto-login as demo user (using test account)
        const credentials = {
          admin: { email: 'admin@talebedu.om', password: 'admin123' },
          parent: { email: 'parent@talebedu.om', password: 'parent123' },
          teacher: { email: 'teacher@talebedu.om', password: 'teacher123' },
          student: { email: 'student@talebedu.om', password: 'student123' },
          driver: { email: 'driver@talebedu.om', password: 'driver123' },
          canteen: { email: 'canteen@talebedu.om', password: 'canteen123' }
        };

        const creds = credentials[role as keyof typeof credentials];
        if (creds) {
          await supabase.auth.signInWithPassword(creds);
        }

        // Set viewport for iPhone 15
        document.body.style.width = '390px';
        document.body.style.height = '844px';
        document.body.style.overflow = 'hidden';
      } catch (error) {
        console.error('Demo setup failed:', error);
      }
    };

    setupDemo();
  }, [userId, role]);

  return <div className="demo-container w-[390px] h-[844px] overflow-auto">{children}</div>;
};

interface DemoRoutesProps {
  language?: 'en' | 'ar';
}

const LanguageWrapper = ({ language, children }: { language: 'en' | 'ar'; children: React.ReactNode }) => {
  const { setLanguage } = useLanguage();
  
  useEffect(() => {
    setLanguage(language);
  }, [language, setLanguage]);
  
  return <>{children}</>;
};

export default function DemoRoutes({ language = 'en' }: DemoRoutesProps) {
  return (
    <LanguageProvider>
      <LanguageWrapper language={language}>
        <Routes>
      {/* Parent Role - 25 states */}
      <Route path="/parent-dashboard" element={<DemoWrapper userId="parent" role="parent"><ParentDashboard /></DemoWrapper>} />
      <Route path="/parent-dashboard-expanded" element={<DemoWrapper userId="parent" role="parent"><ParentDashboard /></DemoWrapper>} />
      <Route path="/parent-wallet" element={<DemoWrapper userId="parent" role="parent"><Wallet /></DemoWrapper>} />
      <Route path="/parent-wallet-topup" element={<DemoWrapper userId="parent" role="parent"><Wallet /></DemoWrapper>} />
      <Route path="/parent-wallet-history" element={<DemoWrapper userId="parent" role="parent"><Wallet /></DemoWrapper>} />
      <Route path="/parent-tracking" element={<DemoWrapper userId="parent" role="parent"><Tracking /></DemoWrapper>} />
      <Route path="/parent-tracking-bus-selected" element={<DemoWrapper userId="parent" role="parent"><Tracking /></DemoWrapper>} />
      <Route path="/parent-tracking-eta" element={<DemoWrapper userId="parent" role="parent"><Tracking /></DemoWrapper>} />
      <Route path="/parent-canteen" element={<DemoWrapper userId="parent" role="parent"><Canteen /></DemoWrapper>} />
      <Route path="/parent-canteen-restrictions" element={<DemoWrapper userId="parent" role="parent"><Canteen /></DemoWrapper>} />
      <Route path="/parent-canteen-history" element={<DemoWrapper userId="parent" role="parent"><Canteen /></DemoWrapper>} />
      <Route path="/parent-grades" element={<DemoWrapper userId="parent" role="parent"><Grades /></DemoWrapper>} />
      <Route path="/parent-grades-subject" element={<DemoWrapper userId="parent" role="parent"><Grades /></DemoWrapper>} />
      <Route path="/parent-grades-attendance" element={<DemoWrapper userId="parent" role="parent"><Grades /></DemoWrapper>} />
      <Route path="/parent-finance" element={<DemoWrapper userId="parent" role="parent"><ParentFinance /></DemoWrapper>} />
      <Route path="/parent-finance-invoice" element={<DemoWrapper userId="parent" role="parent"><ParentFinance /></DemoWrapper>} />
      <Route path="/parent-finance-payment" element={<DemoWrapper userId="parent" role="parent"><ParentFinance /></DemoWrapper>} />
      <Route path="/parent-finance-receipt" element={<DemoWrapper userId="parent" role="parent"><ParentFinance /></DemoWrapper>} />
      <Route path="/registration-step-1" element={<DemoWrapper userId="parent" role="parent"><StudentRegistrationWizard /></DemoWrapper>} />
      <Route path="/registration-step-2" element={<DemoWrapper userId="parent" role="parent"><StudentRegistrationWizard /></DemoWrapper>} />
      <Route path="/registration-step-3" element={<DemoWrapper userId="parent" role="parent"><StudentRegistrationWizard /></DemoWrapper>} />
      <Route path="/registration-step-4" element={<DemoWrapper userId="parent" role="parent"><StudentRegistrationWizard /></DemoWrapper>} />
      <Route path="/registration-step-5" element={<DemoWrapper userId="parent" role="parent"><StudentRegistrationWizard /></DemoWrapper>} />
      <Route path="/registration-step-6" element={<DemoWrapper userId="parent" role="parent"><StudentRegistrationWizard /></DemoWrapper>} />
      <Route path="/registration-step-7" element={<DemoWrapper userId="parent" role="parent"><StudentRegistrationWizard /></DemoWrapper>} />

      {/* Admin Role - 45 states */}
      <Route path="/admin-dashboard" element={<DemoWrapper userId="admin" role="admin"><AdminDashboard /></DemoWrapper>} />
      <Route path="/admin-dashboard-kpis" element={<DemoWrapper userId="admin" role="admin"><AdminDashboard /></DemoWrapper>} />
      <Route path="/admin-dashboard-revenue" element={<DemoWrapper userId="admin" role="admin"><AdminDashboard /></DemoWrapper>} />
      <Route path="/admin-dashboard-activity" element={<DemoWrapper userId="admin" role="admin"><AdminDashboard /></DemoWrapper>} />
      <Route path="/admin-dashboard-quick-actions" element={<DemoWrapper userId="admin" role="admin"><AdminDashboard /></DemoWrapper>} />
      <Route path="/admin-students" element={<DemoWrapper userId="admin" role="admin"><StudentManagement /></DemoWrapper>} />
      <Route path="/admin-students-filters" element={<DemoWrapper userId="admin" role="admin"><StudentManagement /></DemoWrapper>} />
      <Route path="/admin-students-profile" element={<DemoWrapper userId="admin" role="admin"><StudentManagement /></DemoWrapper>} />
      <Route path="/admin-students-edit" element={<DemoWrapper userId="admin" role="admin"><StudentManagement /></DemoWrapper>} />
      <Route path="/admin-students-nfc" element={<DemoWrapper userId="admin" role="admin"><StudentManagement /></DemoWrapper>} />
      <Route path="/admin-students-photo" element={<DemoWrapper userId="admin" role="admin"><StudentManagement /></DemoWrapper>} />
      <Route path="/admin-students-export" element={<DemoWrapper userId="admin" role="admin"><StudentManagement /></DemoWrapper>} />
      <Route path="/admin-students-bulk-import" element={<DemoWrapper userId="admin" role="admin"><StudentManagement /></DemoWrapper>} />
      <Route path="/admin-student-approvals" element={<DemoWrapper userId="admin" role="admin"><StudentApprovalDashboard /></DemoWrapper>} />
      <Route path="/admin-student-approval-dialog" element={<DemoWrapper userId="admin" role="admin"><StudentApprovalDashboard /></DemoWrapper>} />
      <Route path="/admin-student-approve" element={<DemoWrapper userId="admin" role="admin"><StudentApprovalDashboard /></DemoWrapper>} />
      <Route path="/admin-student-reject" element={<DemoWrapper userId="admin" role="admin"><StudentApprovalDashboard /></DemoWrapper>} />
      <Route path="/admin-users" element={<DemoWrapper userId="admin" role="admin"><UserManagement /></DemoWrapper>} />
      <Route path="/admin-users-create" element={<DemoWrapper userId="admin" role="admin"><UserManagement /></DemoWrapper>} />
      <Route path="/admin-users-edit" element={<DemoWrapper userId="admin" role="admin"><UserManagement /></DemoWrapper>} />
      <Route path="/admin-users-credentials" element={<DemoWrapper userId="admin" role="admin"><UserManagement /></DemoWrapper>} />
      <Route path="/admin-users-reset-password" element={<DemoWrapper userId="admin" role="admin"><UserManagement /></DemoWrapper>} />
      <Route path="/admin-users-deactivate" element={<DemoWrapper userId="admin" role="admin"><UserManagement /></DemoWrapper>} />
      <Route path="/admin-fees" element={<DemoWrapper userId="admin" role="admin"><FeeManagement /></DemoWrapper>} />
      <Route path="/admin-fees-create" element={<DemoWrapper userId="admin" role="admin"><FeeManagement /></DemoWrapper>} />
      <Route path="/admin-fees-assign" element={<DemoWrapper userId="admin" role="admin"><FeeManagement /></DemoWrapper>} />
      <Route path="/admin-fees-tracking" element={<DemoWrapper userId="admin" role="admin"><FeeManagement /></DemoWrapper>} />
      <Route path="/admin-fees-reminder" element={<DemoWrapper userId="admin" role="admin"><FeeManagement /></DemoWrapper>} />
      <Route path="/admin-fees-reports" element={<DemoWrapper userId="admin" role="admin"><FeeManagement /></DemoWrapper>} />
      <Route path="/admin-nfc" element={<DemoWrapper userId="admin" role="admin"><NFCManagement /></DemoWrapper>} />
      <Route path="/admin-nfc-assign" element={<DemoWrapper userId="admin" role="admin"><NFCManagement /></DemoWrapper>} />
      <Route path="/admin-nfc-write" element={<DemoWrapper userId="admin" role="admin"><NFCManagement /></DemoWrapper>} />
      <Route path="/admin-buses" element={<DemoWrapper userId="admin" role="admin"><BusesManagement /></DemoWrapper>} />
      <Route path="/admin-buses-add" element={<DemoWrapper userId="admin" role="admin"><BusesManagement /></DemoWrapper>} />
      <Route path="/admin-routes" element={<DemoWrapper userId="admin" role="admin"><RoutesManagement /></DemoWrapper>} />
      <Route path="/admin-routes-map" element={<DemoWrapper userId="admin" role="admin"><RoutesManagement /></DemoWrapper>} />
      <Route path="/admin-routes-create" element={<DemoWrapper userId="admin" role="admin"><RoutesManagement /></DemoWrapper>} />
      <Route path="/admin-routes-stops" element={<DemoWrapper userId="admin" role="admin"><RoutesManagement /></DemoWrapper>} />
      <Route path="/admin-drivers" element={<DemoWrapper userId="admin" role="admin"><DriversManagement /></DemoWrapper>} />
      <Route path="/admin-drivers-add" element={<DemoWrapper userId="admin" role="admin"><DriversManagement /></DemoWrapper>} />
      <Route path="/admin-parent-invitations" element={<DemoWrapper userId="admin" role="admin"><ParentInvitationsDashboard /></DemoWrapper>} />
      <Route path="/admin-parent-bulk-invite" element={<DemoWrapper userId="admin" role="admin"><ParentInvitationsDashboard /></DemoWrapper>} />
      <Route path="/admin-finance-dashboard" element={<DemoWrapper userId="admin" role="admin"><Finance /></DemoWrapper>} />
      <Route path="/admin-finance-revenue" element={<DemoWrapper userId="admin" role="admin"><Finance /></DemoWrapper>} />
      <Route path="/admin-finance-reports" element={<DemoWrapper userId="admin" role="admin"><Finance /></DemoWrapper>} />

      {/* Teacher Role - 20 states */}
      <Route path="/teacher-dashboard" element={<DemoWrapper userId="teacher" role="teacher"><TeacherDashboard /></DemoWrapper>} />
      <Route path="/teacher-dashboard-schedule" element={<DemoWrapper userId="teacher" role="teacher"><TeacherDashboard /></DemoWrapper>} />
      <Route path="/teacher-dashboard-exams" element={<DemoWrapper userId="teacher" role="teacher"><TeacherDashboard /></DemoWrapper>} />
      <Route path="/teacher-attendance" element={<DemoWrapper userId="teacher" role="teacher"><Attendance /></DemoWrapper>} />
      <Route path="/teacher-attendance-roster" element={<DemoWrapper userId="teacher" role="teacher"><Attendance /></DemoWrapper>} />
      <Route path="/teacher-attendance-mark" element={<DemoWrapper userId="teacher" role="teacher"><Attendance /></DemoWrapper>} />
      <Route path="/teacher-attendance-nfc" element={<DemoWrapper userId="teacher" role="teacher"><Attendance /></DemoWrapper>} />
      <Route path="/teacher-attendance-report" element={<DemoWrapper userId="teacher" role="teacher"><Attendance /></DemoWrapper>} />
      <Route path="/teacher-grades" element={<DemoWrapper userId="teacher" role="teacher"><Grades /></DemoWrapper>} />
      <Route path="/teacher-grades-entry" element={<DemoWrapper userId="teacher" role="teacher"><Grades /></DemoWrapper>} />
      <Route path="/teacher-grades-distribution" element={<DemoWrapper userId="teacher" role="teacher"><Grades /></DemoWrapper>} />
      <Route path="/teacher-grades-export" element={<DemoWrapper userId="teacher" role="teacher"><Grades /></DemoWrapper>} />
      <Route path="/teacher-homework" element={<DemoWrapper userId="teacher" role="teacher"><Grades /></DemoWrapper>} />
      <Route path="/teacher-homework-assign" element={<DemoWrapper userId="teacher" role="teacher"><Grades /></DemoWrapper>} />
      <Route path="/teacher-homework-submissions" element={<DemoWrapper userId="teacher" role="teacher"><Grades /></DemoWrapper>} />
      <Route path="/teacher-exams" element={<DemoWrapper userId="teacher" role="teacher"><Grades /></DemoWrapper>} />
      <Route path="/teacher-exams-create" element={<DemoWrapper userId="teacher" role="teacher"><Grades /></DemoWrapper>} />
      <Route path="/teacher-exams-schedule" element={<DemoWrapper userId="teacher" role="teacher"><Grades /></DemoWrapper>} />
      <Route path="/teacher-exams-results" element={<DemoWrapper userId="teacher" role="teacher"><Grades /></DemoWrapper>} />
      <Route path="/teacher-exams-analysis" element={<DemoWrapper userId="teacher" role="teacher"><Grades /></DemoWrapper>} />

      {/* Student Role - 15 states */}
      <Route path="/student-dashboard" element={<DemoWrapper userId="student" role="student"><StudentDashboard /></DemoWrapper>} />
      <Route path="/student-dashboard-schedule" element={<DemoWrapper userId="student" role="student"><StudentDashboard /></DemoWrapper>} />
      <Route path="/student-dashboard-homework" element={<DemoWrapper userId="student" role="student"><StudentDashboard /></DemoWrapper>} />
      <Route path="/student-wallet" element={<DemoWrapper userId="student" role="student"><Wallet /></DemoWrapper>} />
      <Route path="/student-wallet-balance" element={<DemoWrapper userId="student" role="student"><Wallet /></DemoWrapper>} />
      <Route path="/student-wallet-purchases" element={<DemoWrapper userId="student" role="student"><Wallet /></DemoWrapper>} />
      <Route path="/student-wallet-request" element={<DemoWrapper userId="student" role="student"><Wallet /></DemoWrapper>} />
      <Route path="/student-canteen" element={<DemoWrapper userId="student" role="student"><Canteen /></DemoWrapper>} />
      <Route path="/student-canteen-menu" element={<DemoWrapper userId="student" role="student"><Canteen /></DemoWrapper>} />
      <Route path="/student-canteen-cart" element={<DemoWrapper userId="student" role="student"><Canteen /></DemoWrapper>} />
      <Route path="/student-canteen-checkout" element={<DemoWrapper userId="student" role="student"><Canteen /></DemoWrapper>} />
      <Route path="/student-social" element={<DemoWrapper userId="student" role="student"><StudentDashboard /></DemoWrapper>} />
      <Route path="/student-friends" element={<DemoWrapper userId="student" role="student"><StudentDashboard /></DemoWrapper>} />
      <Route path="/student-messenger" element={<DemoWrapper userId="student" role="student"><StudentDashboard /></DemoWrapper>} />
      <Route path="/student-messages-send" element={<DemoWrapper userId="student" role="student"><StudentDashboard /></DemoWrapper>} />

      {/* Driver Role - 10 states */}
      <Route path="/driver-dashboard" element={<DemoWrapper userId="driver" role="driver"><DriverDashboard /></DemoWrapper>} />
      <Route path="/driver-dashboard-route" element={<DemoWrapper userId="driver" role="driver"><DriverDashboard /></DemoWrapper>} />
      <Route path="/driver-dashboard-students" element={<DemoWrapper userId="driver" role="driver"><DriverDashboard /></DemoWrapper>} />
      <Route path="/driver-start-route" element={<DemoWrapper userId="driver" role="driver"><DriverDashboard /></DemoWrapper>} />
      <Route path="/driver-boarding-mode" element={<DemoWrapper userId="driver" role="driver"><DriverDashboard /></DemoWrapper>} />
      <Route path="/driver-nfc-scan" element={<DemoWrapper userId="driver" role="driver"><DriverDashboard /></DemoWrapper>} />
      <Route path="/driver-student-checked-in" element={<DemoWrapper userId="driver" role="driver"><DriverDashboard /></DemoWrapper>} />
      <Route path="/driver-student-checked-out" element={<DemoWrapper userId="driver" role="driver"><DriverDashboard /></DemoWrapper>} />
      <Route path="/driver-complete-route" element={<DemoWrapper userId="driver" role="driver"><DriverDashboard /></DemoWrapper>} />
      <Route path="/driver-route-history" element={<DemoWrapper userId="driver" role="driver"><DriverDashboard /></DemoWrapper>} />

      {/* Canteen Role - 8 states */}
      <Route path="/canteen-dashboard" element={<DemoWrapper userId="canteen" role="canteen"><CanteenDashboard /></DemoWrapper>} />
      <Route path="/canteen-pos" element={<DemoWrapper userId="canteen" role="canteen"><CanteenDashboard /></DemoWrapper>} />
      <Route path="/canteen-scan-nfc" element={<DemoWrapper userId="canteen" role="canteen"><CanteenDashboard /></DemoWrapper>} />
      <Route path="/canteen-student-balance" element={<DemoWrapper userId="canteen" role="canteen"><CanteenDashboard /></DemoWrapper>} />
      <Route path="/canteen-add-items" element={<DemoWrapper userId="canteen" role="canteen"><CanteenDashboard /></DemoWrapper>} />
      <Route path="/canteen-process-payment" element={<DemoWrapper userId="canteen" role="canteen"><CanteenDashboard /></DemoWrapper>} />
      <Route path="/canteen-transaction-complete" element={<DemoWrapper userId="canteen" role="canteen"><CanteenDashboard /></DemoWrapper>} />
      <Route path="/canteen-daily-report" element={<DemoWrapper userId="canteen" role="canteen"><CanteenDashboard /></DemoWrapper>} />

      {/* Finance Role - 8 states */}
      <Route path="/finance-dashboard" element={<DemoWrapper userId="admin" role="admin"><Finance /></DemoWrapper>} />
      <Route path="/finance-payments" element={<DemoWrapper userId="admin" role="admin"><Finance /></DemoWrapper>} />
      <Route path="/finance-record-payment" element={<DemoWrapper userId="admin" role="admin"><Finance /></DemoWrapper>} />
      <Route path="/finance-receipt-generate" element={<DemoWrapper userId="admin" role="admin"><Finance /></DemoWrapper>} />
      <Route path="/finance-receipt-view" element={<DemoWrapper userId="admin" role="admin"><Finance /></DemoWrapper>} />
      <Route path="/finance-reports" element={<DemoWrapper userId="admin" role="admin"><Finance /></DemoWrapper>} />
      <Route path="/finance-revenue-chart" element={<DemoWrapper userId="admin" role="admin"><Finance /></DemoWrapper>} />
      <Route path="/finance-export" element={<DemoWrapper userId="admin" role="admin"><Finance /></DemoWrapper>} />

      {/* Device & Kiosk - 6 states */}
      <Route path="/device-nfc-kiosk" element={<DemoWrapper userId="admin" role="admin"><div>NFC Kiosk</div></DemoWrapper>} />
      <Route path="/device-entrance-checkpoint" element={<DemoWrapper userId="admin" role="admin"><div>Entrance</div></DemoWrapper>} />
      <Route path="/device-testing" element={<DemoWrapper userId="admin" role="admin"><div>Testing</div></DemoWrapper>} />
        <Route path="/device-nfc-scan-success" element={<DemoWrapper userId="admin" role="admin"><div>Success</div></DemoWrapper>} />
        <Route path="/device-nfc-scan-error" element={<DemoWrapper userId="admin" role="admin"><div>Error</div></DemoWrapper>} />
        <Route path="/device-offline-mode" element={<DemoWrapper userId="admin" role="admin"><div>Offline</div></DemoWrapper>} />
      </Routes>
      </LanguageWrapper>
    </LanguageProvider>
  );
}
