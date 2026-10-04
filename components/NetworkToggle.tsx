'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// إعدادات الاتصال بـ Supabase
const SUPABASE_URL = "https://hriqrzypfwagysqszbyg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyaXFyenlwZndhZ3lzcXN6YnlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NTgwMTYsImV4cCI6MjEwNjUzNDAxNn0.UHFW3I3X-rJHsisms-h4UzeiAAMlntDSD35sXaZLQ4M";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function NetworkToggle() {
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // جلب حالة الشبكة عند فتح الداشبورد
  useEffect(() => {
    const fetchStatus = async () => {
      const { data } = await supabase.from('farm_status').select('is_offline').eq('id', 1).single();
      if (data) {
        setIsOffline(data.is_offline);
      }
    };
    fetchStatus();
  }, []);

  // دالة تبديل حالة الاتصال عند النقر على الزر
  const toggleNetwork = async () => {
    setLoading(true);
    const nextState = !isOffline;
    setIsOffline(nextState);

    await supabase
      .from('farm_status')
      .update({ is_offline: nextState, updated_at: new Date().toISOString() })
      .eq('id', 1);

    setLoading(false);
  };

  return (
    <div className="my-4 flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${isOffline ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`}></span>
        <div>
          <h4 className="text-sm font-semibold text-white">
            {isOffline ? 'Offline Mode Active (Edge Guardian Autonomous)' : 'Network Online (Cloud Connected)'}
          </h4>
          <p className="text-xs text-slate-400">
            {isOffline ? 'Farm is completely disconnected from internet.' : 'Real-time telemetry syncing with Agronomist Cloud.'}
          </p>
        </div>
      </div>

      <button
        onClick={toggleNetwork}
        disabled={loading}
        className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer ${
          isOffline
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/30'
            : 'bg-red-600 hover:bg-red-500 text-white ring-2 ring-red-400/30'
        }`}
      >
        {loading ? 'Updating...' : isOffline ? '🔌 Reconnect Network' : '⚠️ Simulate Network Drop'}
      </button>
    </div>
  );
}