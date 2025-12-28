import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WHATSAPP_COLORS } from './WhatsAppTheme';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  isArabic?: boolean;
}

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐'],
  'Gestures': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '❤️‍🔥', '❤️‍🩹'],
  'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆'],
  'Food': ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯'],
  'Objects': ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🧯', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈'],
  'Symbols': ['❤️', '💔', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '🏳️', '🏴', '🏁', '🚩', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇦🇪', '🇸🇦', '🇪🇬', '🇺🇸', '🇬🇧', '✅', '❌', '❓', '❗', '⭐', '🌟', '✨', '⚡', '🔥', '💥', '🎵', '🎶', '➕', '➖', '➗', '✖️', '♾️', '💲', '💱', '™️', '©️', '®️', '〰️', '➰', '➿', '🔚', '🔙', '🔛', '🔝', '🔜', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤']
};

const CATEGORY_ICONS: Record<string, string> = {
  'Smileys': '😀',
  'Gestures': '👋',
  'Hearts': '❤️',
  'Animals': '🐶',
  'Food': '🍔',
  'Objects': '💡',
  'Symbols': '❤️'
};

export function EmojiPicker({ onSelect, isArabic = false }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState('Smileys');
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('recentEmojis') || '[]');
    } catch {
      return [];
    }
  });

  const handleEmojiSelect = (emoji: string) => {
    onSelect(emoji);
    
    // Update recent emojis
    const updated = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 20);
    setRecentEmojis(updated);
    localStorage.setItem('recentEmojis', JSON.stringify(updated));
  };

  return (
    <div 
      className="w-full h-64 rounded-t-xl overflow-hidden"
      style={{ backgroundColor: WHATSAPP_COLORS.bgSecondary }}
    >
      {/* Category tabs */}
      <div 
        className="flex items-center gap-1 px-2 py-2 border-b"
        style={{ borderColor: WHATSAPP_COLORS.divider }}
      >
        {recentEmojis.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            style={{ 
              backgroundColor: activeCategory === 'Recent' ? WHATSAPP_COLORS.bgTertiary : 'transparent'
            }}
            onClick={() => setActiveCategory('Recent')}
          >
            <span className="text-lg">🕐</span>
          </Button>
        )}
        {Object.keys(EMOJI_CATEGORIES).map(category => (
          <Button
            key={category}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            style={{ 
              backgroundColor: activeCategory === category ? WHATSAPP_COLORS.bgTertiary : 'transparent'
            }}
            onClick={() => setActiveCategory(category)}
          >
            <span className="text-lg">{CATEGORY_ICONS[category]}</span>
          </Button>
        ))}
      </div>

      {/* Emoji grid */}
      <ScrollArea className="h-[calc(100%-48px)]">
        <div className="p-2">
          <h3 
            className="text-xs font-medium mb-2 px-1"
            style={{ color: WHATSAPP_COLORS.textSecondary }}
          >
            {activeCategory === 'Recent' ? (isArabic ? 'الأخيرة' : 'Recent') : activeCategory}
          </h3>
          <div className="grid grid-cols-8 gap-1">
            {(activeCategory === 'Recent' ? recentEmojis : EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES]).map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-xl"
                onClick={() => handleEmojiSelect(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
