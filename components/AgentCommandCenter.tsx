'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AgentCommandCenter() {
  const [instruction, setInstruction] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [edgeLogs, setEdgeLogs] = useState<any[]>([]);

  // استدعاء السجلات الحية من الوكيل الطرفي
  useEffect(() => {
    fetchLogs();
    // تفعيل التحديث الفوري (Realtime) عندما يتخذ Edge Agent قراراً
    const subscription = supabase
      .channel('edge_logs_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'edge_logs' }, (payload) => {
        setEdgeLogs((current) => [payload.new, ...current].slice(0, 5)); // عرض آخر 5 إجراءات
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, []);

  const fetchLogs = async () => {
    const { data } = await supabase.from('edge_logs').select('*').order('created_at', { ascending: false }).limit(5);
    if (data) setEdgeLogs(data);
  };

  const deployPolicy = async () => {
    if (!instruction) return;
    setIsDeploying(true);
    
    try {
      const res = await fetch('/api/agronomist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction })
      });
      
      const data = await res.json();
      if (data.success) {
        alert('تم نشر السياسة بنجاح إلى الوكيل الطرفي! 🚀\n' + JSON.stringify(data.policy, null, 2));
        setInstruction('');
      } else {
        alert('حدث خطأ: ' + data.error);
      }
    } catch (error) {
      console.error(error);
    }
    setIsDeploying(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      {/* قسم كتابة السياسات */}
      <div className="bg-slate-900 border border-emerald-500/30 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-emerald-400 mb-2">The Agronomist Cloud Agent</h2>
        <p className="text-sm text-slate-400 mb-4">اكتب التوجيهات الزراعية باللغة الطبيعية (عربي/إنجليزي)، وسيقوم الذكاء الاصطناعي بترجمتها برمجياً للمزرعة.</p>
        
        <textarea 
          className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-3 mb-4 focus:outline-none focus:border-emerald-500"
          rows={3}
          placeholder="مثال: إذا جفت التربة وانخفضت نسبة الرطوبة عن 20، قم بتشغيل المضخة فوراً."
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
        />
        
        <button 
          onClick={deployPolicy}
          disabled={isDeploying}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg transition-colors flex justify-center items-center"
        >
          {isDeploying ? 'جاري التحليل والنشر...' : 'نشر السياسة للمزرعة (Deploy to Edge)'}
        </button>
      </div>

      {/* قسم مراقبة الوكيل الطرفي (Edge Guardian) */}
      <div className="bg-slate-900 border border-blue-500/30 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-blue-400 mb-2">Edge Guardian Autonomous Logs</h2>
        <p className="text-sm text-slate-400 mb-4">سجل الإجراءات التي اتخذها وكيل الطرف في المزرعة بشكل مستقل (بدون تدخل بشري).</p>
        
        <div className="space-y-3">
          {edgeLogs.map((log, index) => (
            <div key={index} className="bg-slate-800 p-3 rounded flex justify-between items-center border border-slate-700">
              <div>
                <span className={`px-2 py-1 text-xs font-bold rounded mr-2 ${log.action_executed === 'PUMP_ON' ? 'bg-blue-900 text-blue-300' : 'bg-orange-900 text-orange-300'}`}>
                  {log.action_executed}
                </span>
                <span className="text-slate-300 text-sm">القراءة الحالية: {log.sensor_reading_at_time}</span>
              </div>
              <div className="text-xs text-slate-500">
                {new Date(log.created_at).toLocaleTimeString()}
                {log.is_offline_execution && <span className="ml-2 text-red-400">(Offline Action)</span>}
              </div>
            </div>
          ))}
          {edgeLogs.length === 0 && <div className="text-slate-500 text-sm text-center">لا توجد إجراءات مسجلة بعد...</div>}
        </div>
      </div>
    </div>
  );
}