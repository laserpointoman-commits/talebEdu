interface LogoLoaderProps {
  size?: 'small' | 'medium' | 'large';
  text?: boolean;
  className?: string;
  showText?: boolean;
  fullScreen?: boolean;
}

export default function LogoLoader({ size = 'medium', text = false, className, showText, fullScreen = false }: LogoLoaderProps) {
  const shouldShowText = showText !== undefined ? showText : text;
  const sizes = {
    small: { logo: 'text-4xl', text: 'text-sm' },
    medium: { logo: 'text-6xl', text: 'text-base' },
    large: { logo: 'text-8xl', text: 'text-lg' },
  };
  const s = sizes[size];

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className || ''}`}>
      <div className={`${s.logo} font-bold text-primary animate-pulse`}>t</div>
      {shouldShowText && (
        <span className={`${s.text} text-muted-foreground`}>Loading...</span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        {content}
      </div>
    );
  }

  return content;
}
