// School App Blue Theme - Replaces WhatsApp Green Theme
export const MESSENGER_COLORS = {
  // Backgrounds - Blue-tinted dark theme
  bg: '#0A1929',           // Dark navy blue
  bgSecondary: '#0D2137',  // Slightly lighter navy
  bgTertiary: '#132F4C',   // Panel backgrounds
  headerBg: '#132F4C',     // Header background
  inputBg: '#1A3A5C',      // Input field background
  
  // Accent colors - School app blue spectrum
  accent: '#0284C7',       // Primary blue (matches school app)
  accentLight: '#38BDF8',  // Light blue
  accentDark: '#0369A1',   // Dark blue
  accentGlow: '#7DD3FC',   // Glow effect
  
  // Text colors
  textPrimary: '#E2E8F0',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  
  // Dividers and borders
  divider: '#1E3A5F',
  border: '#1A3A5C',
  
  // Message bubbles - Blue theme
  messageSent: '#0369A1',      // Sent message - darker blue
  messageReceived: '#132F4C',  // Received message - navy
  
  // Status colors
  unreadBadge: '#38BDF8',      // Light blue for unread
  missedCall: '#F43F5E',       // Red for missed calls
  
  // Checkmarks - Blue themed
  checkGray: '#64748B',        // Unread/delivered gray
  checkBlue: '#38BDF8',        // Read - light blue
  
  // Task-specific colors
  taskAccept: '#22C55E',       // Green for accept
  taskDecline: '#EF4444',      // Red for decline
  taskPending: '#F59E0B',      // Orange for pending
  
  // Overlay
  overlay: 'rgba(10, 25, 41, 0.8)',
  
  // Light theme (for web view with light mode)
  light: {
    bg: '#F8FAFC',
    bgSecondary: '#F1F5F9',
    bgTertiary: '#E2E8F0',
    headerBg: '#0284C7',       // Blue header
    inputBg: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    divider: '#E2E8F0',
    messageSent: '#DBEAFE',    // Light blue for sent
    messageReceived: '#FFFFFF',
    chatBg: '#E0F2FE',         // Very light blue chat background
    sidebarBg: '#FFFFFF',
    panelBg: '#F1F5F9'
  }
};

// School App Gradients
export const MESSENGER_GRADIENTS = {
  statusRing: 'linear-gradient(45deg, #0284C7, #38BDF8)',
  header: 'linear-gradient(180deg, #132F4C 0%, #0A1929 100%)',
  accent: 'linear-gradient(135deg, #0284C7, #38BDF8)',
  hero: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 50%, #38BDF8 100%)'
};

// Common emoji reactions
export const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

// Message status icons
export const MESSAGE_STATUS = {
  sending: 'clock',
  sent: 'check',
  delivered: 'check-check',
  read: 'check-check-blue'
} as const;

// Star colors for favorite messages
export const STAR_COLOR = '#F59E0B';

// Task message statuses
export const TASK_STATUS_COLORS = {
  pending: '#F59E0B',
  accepted: '#22C55E',
  declined: '#EF4444',
};
