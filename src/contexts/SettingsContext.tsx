import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Settings = {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  upi_id: string;
};

const SettingsContext = createContext<{ settings: Settings | null; loading: boolean }>({ settings: null, loading: true });

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("site_settings").select("*").limit(1).single();
      if (data) setSettings(data as Settings);
      setLoading(false);
    };
    fetchSettings();

    // 🚀 Realtime Magic: Admin panel se change hote hi website pe update ho jayega
    const channel = supabase.channel('site_settings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, (payload) => {
        setSettings(payload.new as Settings);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);