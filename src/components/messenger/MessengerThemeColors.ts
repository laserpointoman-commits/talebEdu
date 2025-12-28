// Dynamic theme colors for Messenger - supports both light and dark modes
// FIXED CONTRASTING BUBBLE COLORS for maximum visibility of time/date and checkmarks

export const getMessengerColors = (isDark: boolean) => {
  if (isDark) {
    return {
      // Backgrounds - Blue-tinted dark theme
      bg: '#0A1929',
      bgSecondary: '#0D2137',
      bgTertiary: '#132F4C',
      headerBg: '#132F4C',
      inputBg: '#1A3A5C',
      chatBg: '#0A1929',
      
      // Accent colors - School app blue spectrum
      accent: '#0284C7',
      accentLight: '#38BDF8',
      accentDark: '#0369A1',
      accentGlow: '#7DD3FC',
      
      // Text colors
      textPrimary: '#E2E8F0',
      textSecondary: '#94A3B8',
      textMuted: '#64748B',
      
      // Dividers and borders
      divider: '#1E3A5F',
      border: '#1A3A5C',
      
      // FIXED Message bubbles - HIGH CONTRAST for visibility
      // Sent bubble: Deep blue that ensures white/light text is visible
      messageSent: '#1E40AF',
      // Received bubble: Darker background for contrast
      messageReceived: '#1E293B',
      
      // Time text inside bubbles - MAXIMUM visibility with fixed contrasting colors
      timeTextSent: '#93C5FD',     // Light blue on dark blue sent bubble
      timeTextReceived: '#94A3B8', // Gray on dark received bubble
      
      // Status colors
      unreadBadge: '#38BDF8',
      missedCall: '#F43F5E',
      
      // Checkmarks - DISTINCT and VISIBLE on bubble backgrounds
      checkGray: '#6B7280',        // Single check (sent)
      checkDelivered: '#9CA3AF',   // Double check gray (delivered)
      checkBlue: '#60A5FA',        // Double check blue (read) - bright and visible
      
      // Task-specific colors
      taskAccept: '#22C55E',
      taskDecline: '#EF4444',
      taskPending: '#F59E0B',
      
      // Overlay
      overlay: 'rgba(10, 25, 41, 0.8)',
      
      // Swipe action colors
      swipeDelete: '#EF4444',
      swipeArchive: '#64748B',
      swipePin: '#F59E0B',
    };
  }
  
  // Light theme with FIXED CONTRASTING bubble colors
  return {
    // Backgrounds
    bg: '#F8FAFC',
    bgSecondary: '#F1F5F9',
    bgTertiary: '#E2E8F0',
    headerBg: '#0284C7',
    inputBg: '#FFFFFF',
    chatBg: '#E0F2FE',
    
    // Accent colors
    accent: '#0284C7',
    accentLight: '#38BDF8',
    accentDark: '#0369A1',
    accentGlow: '#7DD3FC',
    
    // Text colors
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    
    // Dividers and borders
    divider: '#E2E8F0',
    border: '#CBD5E1',
    
    // FIXED Message bubbles - HIGH CONTRAST for visibility
    // Sent bubble: Soft blue that works well with dark text
    messageSent: '#BFDBFE',
    // Received bubble: Pure white for maximum contrast
    messageReceived: '#FFFFFF',
    
    // Time text inside bubbles - MAXIMUM visibility with fixed contrasting colors
    timeTextSent: '#1E40AF',      // Dark blue on light blue sent bubble
    timeTextReceived: '#64748B',   // Medium gray on white received bubble
    
    // Status colors
    unreadBadge: '#0284C7',
    missedCall: '#EF4444',
    
    // Checkmarks - DISTINCT and VISIBLE on bubble backgrounds
    checkGray: '#9CA3AF',         // Single check (sent)
    checkDelivered: '#6B7280',    // Double check gray (delivered)
    checkBlue: '#2563EB',         // Double check blue (read) - visible on light bubbles
    
    // Task-specific colors
    taskAccept: '#22C55E',
    taskDecline: '#EF4444',
    taskPending: '#F59E0B',
    
    // Overlay
    overlay: 'rgba(248, 250, 252, 0.9)',
    
    // Swipe action colors
    swipeDelete: '#EF4444',
    swipeArchive: '#64748B',
    swipePin: '#F59E0B',
  };
};

export const MESSENGER_GRADIENTS = {
  statusRing: 'linear-gradient(45deg, #0284C7, #38BDF8)',
  header: 'linear-gradient(180deg, #132F4C 0%, #0A1929 100%)',
  headerLight: 'linear-gradient(180deg, #0284C7 0%, #0369A1 100%)',
  accent: 'linear-gradient(135deg, #0284C7, #38BDF8)',
  hero: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 50%, #38BDF8 100%)'
};

export const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export const MESSAGE_STATUS = {
  sending: 'clock',
  sent: 'check',
  delivered: 'check-check',
  read: 'check-check-blue'
} as const;

export const STAR_COLOR = '#F59E0B';

export const TASK_STATUS_COLORS = {
  pending: '#F59E0B',
  accepted: '#22C55E',
  declined: '#EF4444',
};
