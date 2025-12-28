// WhatsApp Dark Theme Colors
export const WHATSAPP_COLORS = {
  // Backgrounds
  bg: '#0B141A',
  bgSecondary: '#111B21',
  bgTertiary: '#1F2C34',
  headerBg: '#1F2C34',
  inputBg: '#2A3942',
  
  // Accent colors
  accent: '#00A884',
  accentLight: '#25D366',
  accentDark: '#128C7E',
  
  // Text colors
  textPrimary: '#E9EDEF',
  textSecondary: '#8696A0',
  textMuted: '#667781',
  
  // Dividers and borders
  divider: '#222D34',
  border: '#2A3942',
  
  // Message bubbles
  messageSent: '#005C4B',
  messageReceived: '#1F2C34',
  
  // Status colors
  unreadBadge: '#25D366',
  missedCall: '#F15C6D',
  blue: '#53BDEB',
  
  // Checkmarks
  checkGray: '#8696A0',
  checkBlue: '#53BDEB',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.6)',
  
  // Light theme (for WhatsApp Web)
  light: {
    bg: '#FFFFFF',
    bgSecondary: '#F0F2F5',
    bgTertiary: '#E4E6EB',
    headerBg: '#F0F2F5',
    inputBg: '#FFFFFF',
    textPrimary: '#111B21',
    textSecondary: '#54656F',
    textMuted: '#8696A0',
    divider: '#E9EDEF',
    messageSent: '#D9FDD3',
    messageReceived: '#FFFFFF',
    chatBg: '#EFEAE2',
    sidebarBg: '#FFFFFF',
    panelBg: '#F0F2F5'
  }
};

// WhatsApp-style gradients
export const WHATSAPP_GRADIENTS = {
  statusRing: 'linear-gradient(45deg, #00A884, #25D366)',
  header: 'linear-gradient(180deg, #1F2C34 0%, #0B141A 100%)'
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
