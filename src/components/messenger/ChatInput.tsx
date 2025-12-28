import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Smile, Camera, Mic, Send, X, Image as ImageIcon, FileText, Sticker, Video } from 'lucide-react';
import { MESSENGER_COLORS } from './MessengerTheme';
import { EmojiPicker } from './EmojiPicker';
import { VoiceRecorder } from './VoiceRecorder';
import { Message } from '@/hooks/useMessenger';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ChatInputProps {
  onSend: (content: string, files: File[], replyTo?: Message) => void;
  onVoiceSend: (audioBlob: Blob, duration: number) => void;
  onTyping: (isTyping: boolean) => void;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  isArabic?: boolean;
}

export function ChatInput({
  onSend,
  onVoiceSend,
  onTyping,
  replyingTo,
  onCancelReply,
  isArabic = false
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const t = (en: string, ar: string) => isArabic ? ar : en;

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleMessageChange = (value: string) => {
    setMessage(value);
    
    // Handle typing indicator
    onTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  const handleSend = () => {
    if (!message.trim() && selectedFiles.length === 0) return;
    
    onSend(message.trim(), selectedFiles, replyingTo || undefined);
    setMessage('');
    setSelectedFiles([]);
    onTyping(false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.size <= 16 * 1024 * 1024); // 16MB limit
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleVoiceSend = (audioBlob: Blob, duration: number) => {
    onVoiceSend(audioBlob, duration);
    setIsRecording(false);
  };

  if (isRecording) {
    return (
      <div className="px-2 py-2" style={{ backgroundColor: MESSENGER_COLORS.bg }}>
        <VoiceRecorder
          onSend={handleVoiceSend}
          onCancel={() => setIsRecording(false)}
          isArabic={isArabic}
          isDark={false}
        />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: MESSENGER_COLORS.bg }}>
      {/* Reply preview */}
      {replyingTo && (
        <div 
          className="px-4 py-2 flex items-center gap-2 border-t"
          style={{ 
            backgroundColor: MESSENGER_COLORS.bgSecondary,
            borderColor: MESSENGER_COLORS.divider
          }}
        >
          <div 
            className="flex-1 rounded px-3 py-2 border-l-4"
            style={{ 
              backgroundColor: MESSENGER_COLORS.bgTertiary,
              borderLeftColor: MESSENGER_COLORS.accent
            }}
          >
            <p className="text-xs font-medium" style={{ color: MESSENGER_COLORS.accent }}>
              {t('Reply', 'رد')}
            </p>
            <p className="text-sm truncate" style={{ color: MESSENGER_COLORS.textSecondary }}>
              {replyingTo.content || '📎 Attachment'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-white/10"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" style={{ color: MESSENGER_COLORS.textMuted }} />
          </Button>
        </div>
      )}

      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div 
          className="px-4 py-2 flex flex-wrap gap-2 border-t"
          style={{ 
            backgroundColor: MESSENGER_COLORS.bgSecondary,
            borderColor: MESSENGER_COLORS.divider
          }}
        >
          {selectedFiles.map((file, index) => (
            <div 
              key={index} 
              className="flex items-center gap-1 rounded-full px-3 py-1"
              style={{ backgroundColor: MESSENGER_COLORS.bgTertiary }}
            >
              {file.type.startsWith('image/') ? (
                <ImageIcon className="h-4 w-4" style={{ color: MESSENGER_COLORS.textSecondary }} />
              ) : file.type.startsWith('video/') ? (
                <Video className="h-4 w-4" style={{ color: MESSENGER_COLORS.textSecondary }} />
              ) : (
                <FileText className="h-4 w-4" style={{ color: MESSENGER_COLORS.textSecondary }} />
              )}
              <span 
                className="text-xs truncate max-w-[100px]" 
                style={{ color: MESSENGER_COLORS.textSecondary }}
              >
                {file.name}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:text-red-500"
                onClick={() => removeFile(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <EmojiPicker 
          onSelect={handleEmojiSelect}
          isArabic={isArabic}
        />
      )}

      {/* Input bar */}
      <div className="px-2 py-2 flex items-center gap-2">
        {/* Attachment button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full hover:bg-white/10"
              style={{ color: MESSENGER_COLORS.textSecondary }}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-3 border-0"
            style={{ backgroundColor: MESSENGER_COLORS.bgTertiary }}
          >
            <div className="grid grid-cols-3 gap-3">
              <button
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div 
                  className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: MESSENGER_COLORS.accent }}
                >
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs" style={{ color: MESSENGER_COLORS.textSecondary }}>
                  {t('Document', 'ملف')}
                </span>
              </button>
              <button
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors"
                onClick={() => imageInputRef.current?.click()}
              >
                <div 
                  className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#E91E63' }}
                >
                  <ImageIcon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs" style={{ color: MESSENGER_COLORS.textSecondary }}>
                  {t('Photo', 'صورة')}
                </span>
              </button>
              <button
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors"
                onClick={() => videoInputRef.current?.click()}
              >
                <div 
                  className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#FF5722' }}
                >
                  <Video className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs" style={{ color: MESSENGER_COLORS.textSecondary }}>
                  {t('Video', 'فيديو')}
                </span>
              </button>
              <button
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors"
                onClick={() => cameraInputRef.current?.click()}
              >
                <div 
                  className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#9C27B0' }}
                >
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs" style={{ color: MESSENGER_COLORS.textSecondary }}>
                  {t('Camera', 'كاميرا')}
                </span>
              </button>
              <button
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div 
                  className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#00BCD4' }}
                >
                  <Sticker className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs" style={{ color: MESSENGER_COLORS.textSecondary }}>
                  {t('Sticker', 'ملصق')}
                </span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Message input */}
        <div 
          className="flex-1 flex items-center gap-2 rounded-full px-4 py-2"
          style={{ backgroundColor: MESSENGER_COLORS.inputBg }}
        >
          <Input
            placeholder={t('Message', 'رسالة')}
            value={message}
            onChange={(e) => handleMessageChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-transparent border-0 text-sm focus-visible:ring-0 p-0 h-auto"
            style={{ color: MESSENGER_COLORS.textPrimary }}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 p-0" 
            style={{ color: MESSENGER_COLORS.textSecondary }}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Camera button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full hover:bg-white/10"
          style={{ color: MESSENGER_COLORS.textSecondary }}
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera className="h-6 w-6" />
        </Button>
        
        {/* Send or Mic button */}
        {message.trim() || selectedFiles.length > 0 ? (
          <Button
            size="icon"
            className="h-10 w-10 rounded-full"
            style={{ backgroundColor: MESSENGER_COLORS.accent }}
            onClick={handleSend}
          >
            <Send className="h-5 w-5 text-white" />
          </Button>
        ) : (
          <Button
            size="icon"
            className="h-10 w-10 rounded-full hover:bg-white/10"
            style={{ color: MESSENGER_COLORS.textSecondary }}
            onClick={() => setIsRecording(true)}
          >
            <Mic className="h-6 w-6" />
          </Button>
        )}
        
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
        />
        <input
          ref={imageInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={videoInputRef}
          type="file"
          multiple
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}