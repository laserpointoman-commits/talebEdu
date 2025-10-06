import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LogoLoader from '@/components/LogoLoader';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import AdminDashboard from '@/pages/dashboards/AdminDashboard';
import TeacherDashboard from '@/pages/dashboards/TeacherDashboard';
import ParentDashboard from '@/pages/dashboards/ParentDashboard';
import DriverDashboard from '@/pages/dashboards/DriverDashboard';
import StudentDashboard from '@/components/dashboards/StudentDashboard';
import DeveloperDashboard from '@/components/dashboards/DeveloperDashboard';
import CanteenDashboard from '@/pages/dashboards/CanteenDashboard';
import SchoolAttendanceDashboard from '@/pages/dashboards/SchoolAttendanceDashboard';
import BusAttendanceDashboard from '@/pages/dashboards/BusAttendanceDashboard';
import Messages from './Messages';
import Grades from './Grades';
import Exams from './Exams';
import Homework from './Homework';
import Wallet from './Wallet';
import Profile from './Profile';
import Settings from './Settings';
import Students from './Students';
import Teachers from './Teachers';
import Classes from './Classes';
import Schedule from './Schedule';
import Attendance from './Attendance';
import BusTracking from './BusTracking';
import Finance from './Finance';
import Payroll from './Payroll';
import Store from './Store';
import Transport from './Transport';
import SchoolKitchen from './SchoolKitchen';
import Canteen from './Canteen';
import Reports from './Reports';
import UserManagement from './admin/UserManagement';
import BusesManagement from './admin/BusesManagement';
import DriversManagement from './admin/DriversManagement';
import RoutesManagement from './admin/RoutesManagement';
import StudentManagement from './admin/StudentManagement';
import EmployeeManagement from './admin/EmployeeManagement';
import ShopManagement from './admin/ShopManagement';
import FeatureVisibilityControl from './admin/FeatureVisibilityControl';
import GeneratePhotos from './admin/GeneratePhotos';
import NFCManagement from './admin/NFCManagement';
import ParentalCanteenControl from '@/components/features/ParentalCanteenControl';

export default function Dashboard() {
  const { user, profile, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Wait for profile to load
  if (!profile) {
    return (
      <LogoLoader size="large" text={true} fullScreen={true} />
    );
  }

  const getDashboardComponent = () => {
    // For developers, check if they're testing a role
    const effectiveRole = profile?.role === 'developer'
      ? (sessionStorage.getItem('developerViewRole') as any) || 'developer'
      : profile?.role;

    // Route based on effective role
    switch (effectiveRole) {
      case 'developer':
        return <DeveloperDashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'parent':
        return <ParentDashboard />;
      case 'student':
        return <StudentDashboard />;
      case 'driver':
        return <DriverDashboard />;
      case 'canteen':
        return <CanteenDashboard />;
      case 'school_attendance':
        return <SchoolAttendanceDashboard />;
      case 'bus_attendance':
        return <BusAttendanceDashboard />;
      default:
        return <ParentDashboard />; // Default to parent view
    }
  };

  return (
    <DashboardLayout>
      <Routes>
        <Route index element={getDashboardComponent()} />
        <Route path="students" element={<Students />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="classes" element={<Classes />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="exams" element={<Exams />} />
        <Route path="homework" element={<Homework />} />
        <Route path="grades" element={<Grades />} />
        <Route path="nfc-attendance" element={<Attendance />} />
        <Route path="bus-tracking" element={<BusTracking />} />
        <Route path="transport" element={<Transport />} />
        <Route path="finance" element={<Finance />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="store" element={<Store />} />
        <Route path="kitchen" element={<SchoolKitchen />} />
        <Route path="canteen" element={<Canteen />} />
        <Route path="messages" element={<Messages />} />
        <Route path="reports" element={<Reports />} />
        <Route path="admin/users" element={<UserManagement />} />
        <Route path="admin/buses" element={<BusesManagement />} />
        <Route path="admin/drivers" element={<DriversManagement />} />
        <Route path="admin/routes" element={<RoutesManagement />} />
        <Route path="admin/students" element={<StudentManagement />} />
        <Route path="admin/employees" element={<EmployeeManagement />} />
        <Route path="admin/shop" element={<ShopManagement />} />
        <Route path="admin/features" element={<FeatureVisibilityControl />} />
        <Route path="admin/photos" element={<GeneratePhotos />} />
        <Route path="admin/nfc" element={<NFCManagement />} />
        <Route path="canteen-controls" element={<ParentalCanteenControl />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={getDashboardComponent()} />
      </Routes>
    </DashboardLayout>
  );
}