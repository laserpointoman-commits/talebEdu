// Legacy WhatsApp theme adapter
//
// Many components were originally built against `WHATSAPP_COLORS`.
// To keep compatibility while matching the School App blue theme, we map the
// WhatsApp exports to the new Messenger theme.

import {
  MESSENGER_COLORS,
  MESSENGER_GRADIENTS,
  QUICK_REACTIONS,
  MESSAGE_STATUS,
} from './MessengerTheme';

export const WHATSAPP_COLORS = {
  ...MESSENGER_COLORS,
  // Backward-compat alias used by some older UI code
  blue: MESSENGER_COLORS.checkBlue,
};

export const WHATSAPP_GRADIENTS = {
  statusRing: MESSENGER_GRADIENTS.statusRing,
  header: MESSENGER_GRADIENTS.header,
};

export { QUICK_REACTIONS, MESSAGE_STATUS };
