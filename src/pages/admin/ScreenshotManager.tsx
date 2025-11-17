import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Camera, Download, Database, Users, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { ScreenshotUploader } from '@/components/admin/ScreenshotUploader';

interface BaseScreenshotConfig {
  id: string;
  name: string;
  route: string;
  description: string;
  category: 'parent' | 'admin' | 'teacher' | 'student' | 'driver' | 'canteen' | 'finance' | 'other';
}

interface ScreenshotConfig extends BaseScreenshotConfig {
  language: 'en' | 'ar';
}

// Base screenshot configurations (without language suffix)
const BASE_SCREENSHOTS: BaseScreenshotConfig[] = [
  // Parent Role (25 screenshots)
  { id: 'parent-dashboard', name: 'Parent Dashboard', route: '/parent-dashboard', description: 'Main dashboard', category: 'parent' },
  { id: 'parent-dashboard-expanded', name: 'Parent Dashboard - Expanded Card', route: '/parent-dashboard-expanded', description: 'Student card expanded', category: 'parent' },
  { id: 'parent-wallet', name: 'Digital Wallet', route: '/parent-wallet', description: 'Wallet 25.50 OMR', category: 'parent' },
  { id: 'parent-wallet-topup', name: 'Wallet Top-up', route: '/screenshot-demo/parent-wallet-topup', description: 'Top-up dialog', category: 'parent' },
  { id: 'parent-wallet-history', name: 'Wallet History', route: '/screenshot-demo/parent-wallet-history', description: 'Transaction history', category: 'parent' },
  { id: 'parent-tracking', name: 'Bus Tracking', route: '/screenshot-demo/parent-tracking', description: 'Muscat map live tracking', category: 'parent' },
  { id: 'parent-tracking-bus', name: 'Bus Info', route: '/screenshot-demo/parent-tracking-bus-selected', description: 'Bus details Route A', category: 'parent' },
  { id: 'parent-tracking-eta', name: 'ETA Notification', route: '/screenshot-demo/parent-tracking-eta', description: 'Arrival notification', category: 'parent' },
  { id: 'parent-canteen', name: 'Canteen Controls', route: '/screenshot-demo/parent-canteen', description: 'Parental controls', category: 'parent' },
  { id: 'parent-canteen-restrictions', name: 'Category Restrictions', route: '/screenshot-demo/parent-canteen-restrictions', description: 'Disable sweets', category: 'parent' },
  { id: 'parent-canteen-history', name: 'Purchase History', route: '/screenshot-demo/parent-canteen-history', description: 'Last 7 days', category: 'parent' },
  { id: 'parent-grades', name: 'Student Grades', route: '/screenshot-demo/parent-grades', description: 'Grades overview', category: 'parent' },
  { id: 'parent-grades-subject', name: 'Subject Breakdown', route: '/screenshot-demo/parent-grades-subject', description: 'Math A+ 95%', category: 'parent' },
  { id: 'parent-grades-attendance', name: 'Attendance Calendar', route: '/screenshot-demo/parent-grades-attendance', description: '30 days view', category: 'parent' },
  { id: 'parent-finance', name: 'Fee Overview', route: '/screenshot-demo/parent-finance', description: 'Outstanding fees', category: 'parent' },
  { id: 'parent-finance-invoice', name: 'Invoice Details', route: '/screenshot-demo/parent-finance-invoice', description: 'Term 1: 650 OMR', category: 'parent' },
  { id: 'parent-finance-payment', name: 'Payment Dialog', route: '/screenshot-demo/parent-finance-payment', description: 'Installment plan', category: 'parent' },
  { id: 'parent-finance-receipt', name: 'Payment Receipt', route: '/screenshot-demo/parent-finance-receipt', description: 'Receipt generated', category: 'parent' },
  { id: 'registration-step-1', name: 'Registration Step 1', route: '/screenshot-demo/registration-step-1', description: 'Student info', category: 'parent' },
  { id: 'registration-step-2', name: 'Registration Step 2', route: '/screenshot-demo/registration-step-2', description: 'Parent/Guardian', category: 'parent' },
  { id: 'registration-step-3', name: 'Registration Step 3', route: '/screenshot-demo/registration-step-3', description: 'Emergency contacts', category: 'parent' },
  { id: 'registration-step-4', name: 'Registration Step 4', route: '/screenshot-demo/registration-step-4', description: 'Medical info', category: 'parent' },
  { id: 'registration-step-5', name: 'Registration Step 5', route: '/screenshot-demo/registration-step-5', description: 'Bus requirements', category: 'parent' },
  { id: 'registration-step-6', name: 'Registration Step 6', route: '/screenshot-demo/registration-step-6', description: 'Photo upload', category: 'parent' },
  { id: 'registration-step-7', name: 'Registration Step 7', route: '/screenshot-demo/registration-step-7', description: 'Review & submit', category: 'parent' },

  // Admin Role (45 screenshots)
  { id: 'admin-dashboard', name: 'Admin Dashboard', route: '/screenshot-demo/admin-dashboard', description: 'Full dashboard', category: 'admin' },
  { id: 'admin-dashboard-kpis', name: 'Admin KPI Cards', route: '/screenshot-demo/admin-dashboard-kpis', description: 'Students, Teachers, Attendance', category: 'admin' },
  { id: 'admin-dashboard-revenue', name: 'Revenue Chart', route: '/screenshot-demo/admin-dashboard-revenue', description: 'Last 6 months', category: 'admin' },
  { id: 'admin-dashboard-activity', name: 'Activity Feed', route: '/screenshot-demo/admin-dashboard-activity', description: 'Recent activity', category: 'admin' },
  { id: 'admin-dashboard-quick-actions', name: 'Quick Actions', route: '/screenshot-demo/admin-dashboard-quick-actions', description: 'Action panel', category: 'admin' },
  { id: 'admin-students', name: 'Student Management', route: '/screenshot-demo/admin-students', description: 'Students table', category: 'admin' },
  { id: 'admin-students-filters', name: 'Student Filters', route: '/screenshot-demo/admin-students-filters', description: 'Filter by grade', category: 'admin' },
  { id: 'admin-students-profile', name: 'Student Profile', route: '/screenshot-demo/admin-students-profile', description: 'Full details Omar', category: 'admin' },
  { id: 'admin-students-edit', name: 'Edit Student', route: '/screenshot-demo/admin-students-edit', description: 'Edit dialog', category: 'admin' },
  { id: 'admin-students-nfc', name: 'NFC Assignment', route: '/screenshot-demo/admin-students-nfc', description: 'Assign NFC card', category: 'admin' },
  { id: 'admin-students-photo', name: 'Generate Photo', route: '/screenshot-demo/admin-students-photo', description: 'AI photo generation', category: 'admin' },
  { id: 'admin-students-export', name: 'Export Students', route: '/screenshot-demo/admin-students-export', description: 'Export dialog', category: 'admin' },
  { id: 'admin-students-bulk-import', name: 'Bulk Import', route: '/screenshot-demo/admin-students-bulk-import', description: 'CSV import', category: 'admin' },
  { id: 'admin-student-approvals', name: 'Student Approvals', route: '/screenshot-demo/admin-student-approvals', description: 'Pending list (3)', category: 'admin' },
  { id: 'admin-student-approval-dialog', name: 'Approval Dialog', route: '/screenshot-demo/admin-student-approval-dialog', description: 'Omar details', category: 'admin' },
  { id: 'admin-student-approve', name: 'Approve Confirmation', route: '/screenshot-demo/admin-student-approve', description: 'Approve button', category: 'admin' },
  { id: 'admin-student-reject', name: 'Rejection Dialog', route: '/screenshot-demo/admin-student-reject', description: 'Reason field', category: 'admin' },
  { id: 'admin-users', name: 'User Management', route: '/screenshot-demo/admin-users', description: 'Users table', category: 'admin' },
  { id: 'admin-users-create', name: 'Create User', route: '/screenshot-demo/admin-users-create', description: 'Teacher role', category: 'admin' },
  { id: 'admin-users-edit', name: 'Edit Permissions', route: '/screenshot-demo/admin-users-edit', description: 'Permission dialog', category: 'admin' },
  { id: 'admin-users-credentials', name: 'Send Credentials', route: '/screenshot-demo/admin-users-credentials', description: 'Email credentials', category: 'admin' },
  { id: 'admin-users-reset-password', name: 'Reset Password', route: '/screenshot-demo/admin-users-reset-password', description: 'Password dialog', category: 'admin' },
  { id: 'admin-users-deactivate', name: 'Deactivate User', route: '/screenshot-demo/admin-users-deactivate', description: 'Confirmation', category: 'admin' },
  { id: 'admin-fees', name: 'Fee Management', route: '/screenshot-demo/admin-fees', description: 'Fee structures', category: 'admin' },
  { id: 'admin-fees-create', name: 'Create Fee', route: '/screenshot-demo/admin-fees-create', description: 'Term 1: 650 OMR', category: 'admin' },
  { id: 'admin-fees-assign', name: 'Assign Fees', route: '/screenshot-demo/admin-fees-assign', description: 'Bulk select students', category: 'admin' },
  { id: 'admin-fees-tracking', name: 'Payment Tracking', route: '/screenshot-demo/admin-fees-tracking', description: 'Payment table', category: 'admin' },
  { id: 'admin-fees-reminder', name: 'Payment Reminder', route: '/screenshot-demo/admin-fees-reminder', description: 'Reminder dialog', category: 'admin' },
  { id: 'admin-fees-reports', name: 'Financial Reports', route: '/screenshot-demo/admin-fees-reports', description: 'Revenue breakdown', category: 'admin' },
  { id: 'admin-nfc', name: 'NFC Management', route: '/screenshot-demo/admin-nfc', description: 'All cards list', category: 'admin' },
  { id: 'admin-nfc-assign', name: 'Assign NFC', route: '/screenshot-demo/admin-nfc-assign', description: 'Assign to student', category: 'admin' },
  { id: 'admin-nfc-write', name: 'Write NFC Tag', route: '/screenshot-demo/admin-nfc-write', description: 'Write interface', category: 'admin' },
  { id: 'admin-buses', name: 'Bus Management', route: '/screenshot-demo/admin-buses', description: 'Buses list (3)', category: 'admin' },
  { id: 'admin-buses-add', name: 'Add Bus', route: '/screenshot-demo/admin-buses-add', description: 'Add bus dialog', category: 'admin' },
  { id: 'admin-routes', name: 'Route Management', route: '/screenshot-demo/admin-routes', description: 'Muscat routes', category: 'admin' },
  { id: 'admin-routes-map', name: 'Routes on Map', route: '/screenshot-demo/admin-routes-map', description: 'Muscat map', category: 'admin' },
  { id: 'admin-routes-create', name: 'Create Route', route: '/screenshot-demo/admin-routes-create', description: 'Add stops', category: 'admin' },
  { id: 'admin-routes-stops', name: 'Route Stops', route: '/screenshot-demo/admin-routes-stops', description: 'Stop list', category: 'admin' },
  { id: 'admin-drivers', name: 'Driver Management', route: '/screenshot-demo/admin-drivers', description: 'Drivers list', category: 'admin' },
  { id: 'admin-drivers-add', name: 'Add Driver', route: '/screenshot-demo/admin-drivers-add', description: 'License upload', category: 'admin' },
  { id: 'admin-parent-invitations', name: 'Parent Invitations', route: '/screenshot-demo/admin-parent-invitations', description: 'Invitations dashboard', category: 'admin' },
  { id: 'admin-parent-bulk-invite', name: 'Bulk Invite', route: '/screenshot-demo/admin-parent-bulk-invite', description: 'Bulk dialog', category: 'admin' },
  { id: 'admin-finance-dashboard', name: 'Finance Dashboard', route: '/screenshot-demo/admin-finance-dashboard', description: 'Finance overview', category: 'admin' },
  { id: 'admin-finance-revenue', name: 'Revenue Analysis', route: '/screenshot-demo/admin-finance-revenue', description: 'Revenue charts', category: 'admin' },
  { id: 'admin-finance-reports', name: 'Financial Reports', route: '/screenshot-demo/admin-finance-reports', description: 'Export reports', category: 'admin' },

  // Teacher Role (20 screenshots)
  { id: 'teacher-dashboard', name: 'Teacher Dashboard', route: '/screenshot-demo/teacher-dashboard', description: 'Class overview', category: 'teacher' },
  { id: 'teacher-dashboard-schedule', name: "Today's Schedule", route: '/screenshot-demo/teacher-dashboard-schedule', description: '6 classes', category: 'teacher' },
  { id: 'teacher-dashboard-exams', name: 'Upcoming Exams', route: '/screenshot-demo/teacher-dashboard-exams', description: 'Exam widget', category: 'teacher' },
  { id: 'teacher-attendance', name: 'Attendance', route: '/screenshot-demo/teacher-attendance', description: 'Class roster', category: 'teacher' },
  { id: 'teacher-attendance-roster', name: 'Class Roster', route: '/screenshot-demo/teacher-attendance-roster', description: 'Grade 5-A (28)', category: 'teacher' },
  { id: 'teacher-attendance-mark', name: 'Mark Attendance', route: '/screenshot-demo/teacher-attendance-mark', description: 'Checkboxes', category: 'teacher' },
  { id: 'teacher-attendance-nfc', name: 'NFC Scan Mode', route: '/screenshot-demo/teacher-attendance-nfc', description: 'Tap wristbands', category: 'teacher' },
  { id: 'teacher-attendance-report', name: 'Attendance Report', route: '/screenshot-demo/teacher-attendance-report', description: 'Weekly view', category: 'teacher' },
  { id: 'teacher-grades', name: 'Grade Management', route: '/screenshot-demo/teacher-grades', description: 'Teacher view', category: 'teacher' },
  { id: 'teacher-grades-entry', name: 'Enter Grades', route: '/screenshot-demo/teacher-grades-entry', description: 'Math exam 28 students', category: 'teacher' },
  { id: 'teacher-grades-distribution', name: 'Grade Distribution', route: '/screenshot-demo/teacher-grades-distribution', description: 'Distribution chart', category: 'teacher' },
  { id: 'teacher-grades-export', name: 'Export Grades', route: '/screenshot-demo/teacher-grades-export', description: 'Excel export', category: 'teacher' },
  { id: 'teacher-homework', name: 'Homework', route: '/screenshot-demo/teacher-homework', description: 'Homework list', category: 'teacher' },
  { id: 'teacher-homework-assign', name: 'Assign Homework', route: '/screenshot-demo/teacher-homework-assign', description: 'Assignment dialog', category: 'teacher' },
  { id: 'teacher-homework-submissions', name: 'Homework Submissions', route: '/screenshot-demo/teacher-homework-submissions', description: 'Submissions tracking', category: 'teacher' },
  { id: 'teacher-exams', name: 'Exam Management', route: '/screenshot-demo/teacher-exams', description: 'Exams list', category: 'teacher' },
  { id: 'teacher-exams-create', name: 'Create Exam', route: '/screenshot-demo/teacher-exams-create', description: 'Exam schedule', category: 'teacher' },
  { id: 'teacher-exams-schedule', name: 'Exam Schedule', route: '/screenshot-demo/teacher-exams-schedule', description: 'Calendar view', category: 'teacher' },
  { id: 'teacher-exams-results', name: 'Exam Results', route: '/screenshot-demo/teacher-exams-results', description: 'Results entry', category: 'teacher' },
  { id: 'teacher-exams-analysis', name: 'Results Analysis', route: '/screenshot-demo/teacher-exams-analysis', description: 'Performance analysis', category: 'teacher' },

  // Student Role (15 screenshots)
  { id: 'student-dashboard', name: 'Student Dashboard', route: '/screenshot-demo/student-dashboard', description: "Omar's dashboard", category: 'student' },
  { id: 'student-dashboard-schedule', name: "Today's Schedule", route: '/screenshot-demo/student-dashboard-schedule', description: 'Class schedule', category: 'student' },
  { id: 'student-dashboard-homework', name: 'Homework Widget', route: '/screenshot-demo/student-dashboard-homework', description: 'Due assignments', category: 'student' },
  { id: 'student-wallet', name: 'Student Wallet', route: '/screenshot-demo/student-wallet', description: '25.50 OMR balance', category: 'student' },
  { id: 'student-wallet-balance', name: 'Wallet Balance', route: '/screenshot-demo/student-wallet-balance', description: 'Balance card', category: 'student' },
  { id: 'student-wallet-purchases', name: 'Recent Purchases', route: '/screenshot-demo/student-wallet-purchases', description: 'Canteen items', category: 'student' },
  { id: 'student-wallet-request', name: 'Request Money', route: '/screenshot-demo/student-wallet-request', description: 'Request dialog', category: 'student' },
  { id: 'student-canteen', name: 'Canteen Menu', route: '/screenshot-demo/student-canteen', description: 'Student menu', category: 'student' },
  { id: 'student-canteen-menu', name: 'Browse Menu', route: '/screenshot-demo/student-canteen-menu', description: 'Product grid', category: 'student' },
  { id: 'student-canteen-cart', name: 'Shopping Cart', route: '/screenshot-demo/student-canteen-cart', description: 'Lays + Water 0.55', category: 'student' },
  { id: 'student-canteen-checkout', name: 'Checkout', route: '/screenshot-demo/student-canteen-checkout', description: 'Pay with wallet', category: 'student' },
  { id: 'student-social', name: 'Social Hub', route: '/screenshot-demo/student-social', description: 'Social feed', category: 'student' },
  { id: 'student-friends', name: 'Friends List', route: '/screenshot-demo/student-friends', description: 'Friends', category: 'student' },
  { id: 'student-messenger', name: 'Messenger', route: '/screenshot-demo/student-messenger', description: 'Chat interface', category: 'student' },
  { id: 'student-messages-send', name: 'Send Message', route: '/screenshot-demo/student-messages-send', description: 'Message flow', category: 'student' },

  // Driver Role (10 screenshots)
  { id: 'driver-dashboard', name: 'Driver Dashboard', route: '/screenshot-demo/driver-dashboard', description: 'Route overview', category: 'driver' },
  { id: 'driver-dashboard-route', name: 'Route Map', route: '/screenshot-demo/driver-dashboard-route', description: 'Muscat route', category: 'driver' },
  { id: 'driver-dashboard-students', name: 'Students List', route: '/screenshot-demo/driver-dashboard-students', description: 'Assigned students', category: 'driver' },
  { id: 'driver-start-route', name: 'Start Route', route: '/screenshot-demo/driver-start-route', description: 'Start button', category: 'driver' },
  { id: 'driver-boarding-mode', name: 'Boarding Mode', route: '/screenshot-demo/driver-boarding-mode', description: 'NFC active', category: 'driver' },
  { id: 'driver-nfc-scan', name: 'NFC Scan', route: '/screenshot-demo/driver-nfc-scan', description: 'Scan wristband', category: 'driver' },
  { id: 'driver-student-checked-in', name: 'Student Boarded', route: '/screenshot-demo/driver-student-checked-in', description: 'Omar checked in', category: 'driver' },
  { id: 'driver-student-checked-out', name: 'Student Alighted', route: '/screenshot-demo/driver-student-checked-out', description: 'Omar checked out', category: 'driver' },
  { id: 'driver-complete-route', name: 'Complete Route', route: '/screenshot-demo/driver-complete-route', description: 'Confirmation', category: 'driver' },
  { id: 'driver-route-history', name: 'Route History', route: '/screenshot-demo/driver-route-history', description: 'Past routes', category: 'driver' },

  // Canteen Role (8 screenshots)
  { id: 'canteen-dashboard', name: 'Canteen Dashboard', route: '/screenshot-demo/canteen-dashboard', description: 'POS system', category: 'canteen' },
  { id: 'canteen-pos', name: 'Point of Sale', route: '/screenshot-demo/canteen-pos', description: 'POS interface', category: 'canteen' },
  { id: 'canteen-scan-nfc', name: 'Scan NFC', route: '/screenshot-demo/canteen-scan-nfc', description: 'NFC reader active', category: 'canteen' },
  { id: 'canteen-student-balance', name: 'Student Balance', route: '/screenshot-demo/canteen-student-balance', description: 'Omar 25.50 OMR', category: 'canteen' },
  { id: 'canteen-add-items', name: 'Add Items', route: '/screenshot-demo/canteen-add-items', description: 'Product selection', category: 'canteen' },
  { id: 'canteen-process-payment', name: 'Process Payment', route: '/screenshot-demo/canteen-process-payment', description: 'Deduct 2.35 OMR', category: 'canteen' },
  { id: 'canteen-transaction-complete', name: 'Transaction Complete', route: '/screenshot-demo/canteen-transaction-complete', description: 'Success message', category: 'canteen' },
  { id: 'canteen-daily-report', name: 'Daily Report', route: '/screenshot-demo/canteen-daily-report', description: 'Sales report', category: 'canteen' },

  // Finance Role (8 screenshots)
  { id: 'finance-dashboard', name: 'Finance Dashboard', route: '/screenshot-demo/finance-dashboard', description: 'Finance overview', category: 'finance' },
  { id: 'finance-payments', name: 'Payment Tracking', route: '/screenshot-demo/finance-payments', description: 'Payments table', category: 'finance' },
  { id: 'finance-record-payment', name: 'Record Payment', route: '/screenshot-demo/finance-record-payment', description: 'Payment dialog', category: 'finance' },
  { id: 'finance-receipt-generate', name: 'Generate Receipt', route: '/screenshot-demo/finance-receipt-generate', description: 'Receipt generation', category: 'finance' },
  { id: 'finance-receipt-view', name: 'View Receipt', route: '/screenshot-demo/finance-receipt-view', description: 'Receipt preview', category: 'finance' },
  { id: 'finance-reports', name: 'Financial Reports', route: '/screenshot-demo/finance-reports', description: 'Reports dashboard', category: 'finance' },
  { id: 'finance-revenue-chart', name: 'Revenue Chart', route: '/screenshot-demo/finance-revenue-chart', description: 'Revenue vs expenses', category: 'finance' },
  { id: 'finance-export', name: 'Export Reports', route: '/screenshot-demo/finance-export', description: 'Export dialog', category: 'finance' },

  // Device & Kiosk (6 screenshots)
  { id: 'device-nfc-kiosk', name: 'NFC Kiosk', route: '/screenshot-demo/device-nfc-kiosk', description: 'Standalone scanner', category: 'other' },
  { id: 'device-entrance-checkpoint', name: 'Entrance Checkpoint', route: '/screenshot-demo/device-entrance-checkpoint', description: 'School entrance', category: 'other' },
  { id: 'device-testing', name: 'Device Testing', route: '/screenshot-demo/device-testing', description: 'Testing interface', category: 'other' },
  { id: 'device-nfc-scan-success', name: 'Scan Success', route: '/screenshot-demo/device-nfc-scan-success', description: 'Success state', category: 'other' },
  { id: 'device-nfc-scan-error', name: 'Scan Error', route: '/screenshot-demo/device-nfc-scan-error', description: 'Error state', category: 'other' },
  { id: 'device-offline-mode', name: 'Offline Mode', route: '/screenshot-demo/device-offline-mode', description: 'Offline indicator', category: 'other' }
];

// Generate 274 screenshots (137 English + 137 Arabic)
const SCREENSHOTS: ScreenshotConfig[] = [
  ...BASE_SCREENSHOTS.map(s => ({ ...s, language: 'en' as const })),
  ...BASE_SCREENSHOTS.map(s => ({ ...s, language: 'ar' as const }))
];

export default function ScreenshotManager() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dataStatus, setDataStatus] = useState<'unknown' | 'ready' | 'empty'>('unknown');
  const [generatedScreenshots, setGeneratedScreenshots] = useState<Set<string>>(new Set());

  const initializeMockData = async () => {
    setIsInitializing(true);
    try {
      // First, create test accounts
      toast({ title: 'Creating test accounts...', description: 'Setting up 6 user accounts' });
      
      const { error: accountsError } = await supabase.functions.invoke('create-test-accounts');
      if (accountsError) throw accountsError;

      // Then, seed comprehensive mock data
      toast({ title: 'Seeding mock data...', description: 'Creating students, products, routes...' });
      
      const { data, error } = await supabase.functions.invoke('seed-mock-data');
      
      if (error) throw error;

      toast({
        title: '✅ Mock Data Initialized',
        description: `Created ${data.summary.students} students, ${data.summary.products} products, ${data.summary.routes} routes`,
      });
      
      setDataStatus('ready');
    } catch (error) {
      console.error('Error initializing data:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to initialize mock data',
        variant: 'destructive',
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const generateAllScreenshots = async () => {
    setIsGenerating(true);
    setProgress(0);
    
    try {
      toast({
        title: 'Starting Automated Generation',
        description: 'Generating all 274 screenshots with AI. This will take 20-30 minutes.',
      });

      const total = SCREENSHOTS.length;
      const generated = new Set<string>();
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < total; i++) {
        const screenshot = SCREENSHOTS[i];
        
        try {
          toast({
            title: `Generating ${i + 1}/${total}`,
            description: `${screenshot.name} (${screenshot.language})...`
          });

          // Generate AI screenshot with detailed prompt
          const prompt = `Generate a professional mobile app screenshot mockup.

Screen: ${screenshot.name} (${screenshot.language === 'ar' ? 'Arabic' : 'English'})
Route: ${screenshot.route}
Description: ${screenshot.description}
Category: ${screenshot.category}

Create a realistic ${screenshot.language === 'ar' ? 'Arabic (RTL)' : 'English'} mobile interface for an educational school management system.
- iPhone 15 proportions (390x844px)
- Modern, clean design with proper ${screenshot.language === 'ar' ? 'right-to-left' : 'left-to-right'} layout
- Include realistic data (Omani school context)
- Professional color scheme
- Proper status bar and navigation
- Ultra high resolution, production quality`;

          const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-screenshot-ai', {
            body: {
              prompt,
              width: 390,
              height: 844
            }
          });

          if (aiError) throw aiError;
          if (!aiData?.imageBase64) throw new Error('No image generated');

          // Add iPhone 15 frame
          const { data: frameData, error: frameError } = await supabase.functions.invoke('add-iphone-frame', {
            body: {
              imageBase64: aiData.imageBase64
            }
          });

          if (frameError) throw frameError;
          if (!frameData?.framedImageBase64) throw new Error('No framed image');

          // Store in localStorage
          const storageKey = `screenshot-${screenshot.id}-${screenshot.language}`;
          localStorage.setItem(storageKey, frameData.framedImageBase64);
          
          generated.add(storageKey);
          setGeneratedScreenshots(new Set(generated));
          successCount++;
          setProgress(((i + 1) / total) * 100);
          
          console.log(`✓ Generated: ${screenshot.name}`);
          
          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          failCount++;
          console.error(`✗ Failed: ${screenshot.name}:`, error);
          
          // Check for rate limit or payment errors
          if (error instanceof Error) {
            if (error.message.includes('429')) {
              toast({
                title: 'Rate Limited',
                description: 'Waiting 10 seconds before continuing...',
                variant: 'default'
              });
              await new Promise(resolve => setTimeout(resolve, 10000));
            } else if (error.message.includes('402')) {
              toast({
                title: 'Out of Credits',
                description: 'Please add credits in Settings → Workspace → Usage',
                variant: 'destructive'
              });
              setIsGenerating(false);
              return;
            }
          }
        }
      }

      toast({
        title: 'Generation Complete!',
        description: `Success: ${successCount}, Failed: ${failCount}`,
      });
    } catch (error) {
      console.error('Error generating screenshots:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAllScreenshots = () => {
    try {
      const screenshots = SCREENSHOTS.filter(s => {
        const storageKey = `screenshot-${s.id}-${s.language}`;
        return generatedScreenshots.has(storageKey);
      });
      
      if (screenshots.length === 0) {
        toast({
          title: 'No screenshots to download',
          description: 'Generate screenshots first',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Preparing download',
        description: `Packaging ${screenshots.length} screenshots...`
      });

      // Create download links for each screenshot
      screenshots.forEach((screenshot) => {
        const storageKey = `screenshot-${screenshot.id}-${screenshot.language}`;
        const imageData = localStorage.getItem(storageKey);
        if (imageData) {
          const link = document.createElement('a');
          link.href = imageData;
          link.download = `${screenshot.id}-${screenshot.language}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      });

      toast({
        title: 'Download complete',
        description: `Downloaded ${screenshots.length} screenshots`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  const categoryColors = {
    parent: 'bg-blue-500',
    admin: 'bg-purple-500',
    teacher: 'bg-green-500',
    student: 'bg-yellow-500',
    driver: 'bg-orange-500',
    canteen: 'bg-pink-500',
    finance: 'bg-cyan-500',
    other: 'bg-gray-500'
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Screenshot Manager</h1>
        <p className="text-muted-foreground">
          Generate 21 professional iPhone 15 screenshots with real Omani data for the complete user manual
        </p>
      </div>

      {/* Status Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {dataStatus === 'ready' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Mock data ready</span>
                </>
              ) : dataStatus === 'empty' ? (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span>No data found</span>
                </>
              ) : (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Checking...</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Accounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6 Accounts</div>
            <p className="text-xs text-muted-foreground">All roles configured</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Screenshots</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {generatedScreenshots.size}/{SCREENSHOTS.length}
            </div>
            <p className="text-xs text-muted-foreground">Ready for manual</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Initialize data and generate screenshots</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={initializeMockData}
              disabled={isInitializing || dataStatus === 'ready'}
              className="flex items-center gap-2"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  Initialize Mock Data
                </>
              )}
            </Button>

            <Button
              onClick={generateAllScreenshots}
              disabled={isGenerating || dataStatus !== 'ready'}
              variant="default"
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating {Math.round(progress)}%
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Generate All Screenshots
                </>
              )}
            </Button>

            <Button
              onClick={downloadAllScreenshots}
              disabled={generatedScreenshots.size === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download All (ZIP)
            </Button>
          </div>

          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Capturing {Math.round((progress / 100) * SCREENSHOTS.length)} of {SCREENSHOTS.length} screenshots...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Screenshot Uploader */}
      <div className="mb-8">
        <ScreenshotUploader />
      </div>

      {/* Screenshots Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Screenshots Library</CardTitle>
          <CardDescription>{SCREENSHOTS.length} screenshots covering all app features in English and Arabic</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SCREENSHOTS.map((screenshot) => {
              const storageKey = `screenshot-${screenshot.id}-${screenshot.language}`;
              const isGenerated = generatedScreenshots.has(storageKey);
              
              return (
                <div
                  key={`${screenshot.id}-${screenshot.language}`}
                  className="border rounded-lg p-4 space-y-2 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{screenshot.name}</h3>
                      <p className="text-sm text-muted-foreground">{screenshot.description}</p>
                      <Badge variant="secondary" className="mt-1">
                        {screenshot.language.toUpperCase()}
                      </Badge>
                    </div>
                    {isGenerated && (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 ml-2" />
                    )}
                  </div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className={`${categoryColors[screenshot.category]} text-white`}>
                    {screenshot.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{screenshot.route}</span>
                </div>
              </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Step 1: Initialize Mock Data</h3>
            <p className="text-sm text-muted-foreground">
              Click "Initialize Mock Data" to create 10 Omani students, 30+ canteen products, 
              3 Muscat bus routes, and comprehensive test data.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Step 2: Generate Screenshots</h3>
            <p className="text-sm text-muted-foreground">
              Click "Generate All Screenshots" to automatically capture 21 screenshots 
              framed in iPhone 15 with transparent backgrounds. Takes ~45 seconds.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Step 3: Download & Use</h3>
            <p className="text-sm text-muted-foreground">
              Download the ZIP file and extract screenshots to /src/assets/presentation/real/ 
              for use in the 150+ page manual.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
