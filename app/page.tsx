"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Droplet, Thermometer, Wind, Power } from "lucide-react";

// Import the Agent Command Center component
import AgentCommandCenter from "@/components/AgentCommandCenter"; 

// 1. استدعاء المكون الجديد هنا
import NetworkToggle from "@/components/NetworkToggle"; 

// Using environment variables for Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export default function Dashboard() {
  const [latestData, setLatestData] = useState<any>(null);

  useEffect(() => {
    // Fetch the latest reading based on created_at timestamp
    const fetchInitialData = async () => {
      const { data, error } = await supabase
        .from("farm_telemetry")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (error) console.error("Error fetching data:", error);
      if (data) setLatestData(data);
    };

    fetchInitialData();

    // Subscribe to realtime updates from Supabase
    const channel = supabase
      .channel("realtime-farm")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "farm_telemetry" },
        (payload) => {
          setLatestData(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Updated Loading State in English
  if (!latestData) return <div className="p-10 text-white bg-gray-900 min-h-screen flex items-center justify-center font-sans">Connecting to virtual farm telemetry...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-slate-200 p-8 font-sans">
      <h1 className="text-4xl font-bold text-emerald-400 mb-4 tracking-wide">
        🌱 AegisCrop - Edge AI Dashboard
      </h1>
      
      {/* 2. إضافة الزر التفاعلي هنا تحت العنوان وفوق البطاقات */}
      <NetworkToggle />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {/* Temperature Card */}
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-lg flex items-center space-x-4">
          <div className="p-4 bg-orange-500/20 rounded-xl text-orange-400">
            <Thermometer size={32} />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Temperature</p>
            <p className="text-3xl font-bold">{latestData.temperature}°C</p>
          </div>
        </div>

        {/* Air Humidity Card */}
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-lg flex items-center space-x-4">
          <div className="p-4 bg-blue-500/20 rounded-xl text-blue-400">
            <Wind size={32} />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Air Humidity</p>
            <p className="text-3xl font-bold">{latestData.humidity}%</p>
          </div>
        </div>

        {/* Soil Moisture Card */}
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-lg flex items-center space-x-4">
          <div className="p-4 bg-emerald-500/20 rounded-xl text-emerald-400">
            <Droplet size={32} />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Soil Moisture</p>
            <p className="text-3xl font-bold">{latestData.soil_moisture}%</p>
          </div>
        </div>

        {/* Pump Status Card */}
        <div className={`p-6 rounded-2xl border shadow-lg flex items-center space-x-4 transition-all duration-500 ${latestData.pump_status ? 'bg-blue-900/30 border-blue-500/50' : 'bg-gray-900 border-gray-800'}`}>
          <div className={`p-4 rounded-xl transition-colors duration-500 ${latestData.pump_status ? 'bg-blue-500 text-white animate-pulse' : 'bg-gray-800 text-gray-500'}`}>
            <Power size={32} />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Pump Status</p>
            <p className={`text-2xl font-bold ${latestData.pump_status ? 'text-blue-400' : 'text-gray-500'}`}>
              {latestData.pump_status ? "ON (Watering)" : "OFF"}
            </p>
          </div>
        </div>
      </div>

      {/* --- Agent Command Center Component --- */}
      <AgentCommandCenter />
      
    </div>
  );
}