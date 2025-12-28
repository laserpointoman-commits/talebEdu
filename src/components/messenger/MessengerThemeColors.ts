// Dynamic theme colors for Messenger - supports both light and dark modes

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
      
      // Message bubbles - Blue theme
      messageSent: '#0369A1',
      messageReceived: '#132F4C',
      
      // Time text inside bubbles - Enhanced visibility
      timeTextSent: '#93C5FD',
      timeTextReceived: '#94A3B8',
      
      // Status colors
      unreadBadge: '#38BDF8',
      missedCall: '#F43F5E',
      
      // Checkmarks - Blue themed with distinct visibility
      checkGray: '#64748B',
      checkBlue: '#38BDF8',
      checkDelivered: '#94A3B8',
      
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
  
  // Light theme
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
    
    // Message bubbles
    messageSent: '#DBEAFE',
    messageReceived: '#FFFFFF',
    
    // Time text inside bubbles - Enhanced visibility
    timeTextSent: '#1E40AF',
    timeTextReceived: '#475569',
    
    // Status colors
    unreadBadge: '#0284C7',
    missedCall: '#EF4444',
    
    // Checkmarks - Distinct visibility
    checkGray: '#94A3B8',
    checkBlue: '#0284C7',
    checkDelivered: '#64748B',
    
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
