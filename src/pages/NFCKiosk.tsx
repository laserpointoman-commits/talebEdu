import React, { useState, useEffect } from 'react';
import StandaloneNFCScanner from '@/components/devices/StandaloneNFCScanner';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { getText } from '@/utils/i18n';

export default function NFCKiosk() {
  const [deviceType, setDeviceType] = useState<'entrance' | 'bus'>('entrance');
  const [location, setLocation] = useState('Main Entrance');
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const t = (en: string, ar: string, hi: string) => getText(language, en, ar, hi);
  
  useEffect(() => {
    loadDeviceConfig();
  }, []);
  
  const loadDeviceConfig = async () => {
    try {
      // Try to get existing device config
      const { data } = await supabase
        .from('device_configs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setDeviceType(data.device_type as 'entrance' | 'bus');
        setLocation(data.location);
        setDeviceId(data.device_id);
      } else {
        // Create new device config
        const newDeviceId = `KIOSK-${Date.now().toString().slice(-6)}`;
        await supabase
          .from('device_configs')
          .insert({
            device_id: newDeviceId,
            device_type: 'entrance',
            location: 'Main Entrance',
            is_active: true
          });
        setDeviceId(newDeviceId);
      }
    } catch (error) {
      console.error('Error loading device config:', error);
      setDeviceId(`KIOSK-${Date.now().toString().slice(-6)}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {t('Loading device configuration...', 'جاري تحميل تكوين الجهاز...', 'उपकरण कॉन्फ़िगरेशन लोड हो रहा है...')}
      </div>
    );
  }

  return (
    <StandaloneNFCScanner 
      deviceType={deviceType}
      location={location}
      deviceId={deviceId}
    />
  );
}