import React, { createContext, useContext, useState, useEffect } from 'react';

type MessengerTheme = 'light' | 'dark' | 'auto';

interface MessengerThemeContextType {
  theme: MessengerTheme;
  setTheme: (theme: MessengerTheme) => void;
  effectiveTheme: 'light' | 'dark';
  isDark: boolean;
}

const MessengerThemeContext = createContext<MessengerThemeContextType | undefined>(undefined);

// Calculate sunrise/sunset based on approximate times
const getSunTimes = () => {
  const now = new Date();
  const month = now.getMonth();
  
  // Approximate sunrise/sunset times by season (for Middle East region)
  let sunriseHour = 6;
  let sunsetHour = 18;
  
  if (month >= 3 && month <= 5) { // Spring
    sunriseHour = 5;
    sunsetHour = 19;
  } else if (month >= 6 && month <= 8) { // Summer
    sunriseHour = 5;
    sunsetHour = 19;
  } else if (month >= 9 && month <= 10) { // Fall
    sunriseHour = 6;
    sunsetHour = 18;
  } else { // Winter
    sunriseHour = 6;
    sunsetHour = 17;
  }
  
  return { sunriseHour, sunsetHour };
};

const isDayTime = () => {
  const now = new Date();
  const hour = now.getHours();
  const { sunriseHour, sunsetHour } = getSunTimes();
  return hour >= sunriseHour && hour < sunsetHour;
};

export function MessengerThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<MessengerTheme>(() => {
    const stored = localStorage.getItem('messenger-theme');
    return (stored as MessengerTheme) || 'auto';
  });
  
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => {
    if (theme === 'auto') {
      return isDayTime() ? 'light' : 'dark';
    }
    return theme;
  });

  const setTheme = (newTheme: MessengerTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('messenger-theme', newTheme);
  };

  // Update effective theme based on time for auto mode
  useEffect(() => {
    const updateEffectiveTheme = () => {
      if (theme === 'auto') {
        setEffectiveTheme(isDayTime() ? 'light' : 'dark');
      } else {
        setEffectiveTheme(theme);
      }
    };

    updateEffectiveTheme();

    // Check every minute for time changes when in auto mode
    if (theme === 'auto') {
      const interval = setInterval(updateEffectiveTheme, 60000);
      return () => clearInterval(interval);
    }
  }, [theme]);

  return (
    <MessengerThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      effectiveTheme,
      isDark: effectiveTheme === 'dark'
    }}>
      {children}
    </MessengerThemeContext.Provider>
  );
}

export function useMessengerTheme() {
  const context = useContext(MessengerThemeContext);
  if (!context) {
    throw new Error('useMessengerTheme must be used within MessengerThemeProvider');
  }
  return context;
}
