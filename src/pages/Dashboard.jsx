import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [telemetry, setTelemetry] = useState(null);
  const [recordedAt, setRecordedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const macAddress = "68:FE:71:87:10:2C";

  useEffect(() => {
    fetchLatestTelemetry();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telemetry_logs',
          filter: `mac_address=eq.${macAddress}`
        },
        (payload) => {
          if (payload.new) {
            parseAndSetData(payload.new);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const parseAndSetData = (record) => {
    try {
      // Xử lý payload nếu Supabase trả về dạng String JSON hoặc Object
      const parsedPayload = typeof record.payload === 'string' 
        ? JSON.parse(record.payload) 
        : record.payload;
      setTelemetry(parsedPayload);
      setRecordedAt(record.recorded_at || record.created_at);
    } catch (e) {
      console.error('Lỗi parse payload:', e);
    }
  };

  const fetchLatestTelemetry = async () => {
    try {
      const { data, error } = await supabase
        .from('telemetry_logs')
        .select('payload, recorded_at, created_at')
        .eq('mac_address', macAddress)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (data) parseAndSetData(data);
    } catch (err) {
      console.error('Lỗi lấy dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-8 font-bold text-gray-500">Đang tải dữ liệu vườn...</div>;

  const soil = telemetry?.soil || {};

  return (
    <div className="space-y-4 max-w-md mx-auto p-1 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-2">
        <div>
          <h1 className="text-lg font-black text-gray-800">🌱 Trạm Cảm Biến 7 Trong 1</h1>
          <p className="text-xs text-gray-500">MAC: {macAddress}</p>
        </div>
        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">● Online</span>
      </div>

      {/* Grid Chỉ Số Môi Trường Core */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-3.5 rounded-xl border shadow-sm">
          <span className="text-xs font-bold text-gray-400">💧 ĐỘ ẨM ĐẤT</span>
          <p className="text-2xl font-black text-blue-600 mt-1">{soil.hum ?? '--'} %</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border shadow-sm">
          <span className="text-xs font-bold text-gray-400">🌡️ NHIỆT ĐỘ</span>
          <p className="text-2xl font-black text-orange-500 mt-1">{soil.tmp ?? '--'} °C</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border shadow-sm">
          <span className="text-xs font-bold text-gray-400">🧪 ĐỘ pH</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{soil.ph ?? '--'}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border shadow-sm">
          <span className="text-xs font-bold text-gray-400">⚡ ĐỘ DẪN EC</span>
          <p className="text-2xl font-black text-purple-600 mt-1">{soil.ec ?? '--'} <span className="text-xs">uS/cm</span></p>
        </div>
      </div>

      {/* Phân Hệ Dinh Dưỡng N-P-K */}
      <div className="bg-white p-4 rounded-xl border shadow-sm space-y-2">
        <h2 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">🌾 Dinh Dưỡng Đất (N - P - K)</h2>
        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="bg-green-50 p-2.5 rounded-lg border border-green-100">
            <span className="text-xs font-bold text-green-700">Đạm (N)</span>
            <p className="text-lg font-black text-green-800 mt-0.5">{soil.n ?? '--'}</p>
            <span className="text-[10px] text-gray-400">mg/kg</span>
          </div>
          <div className="bg-yellow-50 p-2.5 rounded-lg border border-yellow-100">
            <span className="text-xs font-bold text-yellow-700">Lân (P)</span>
            <p className="text-lg font-black text-yellow-800 mt-0.5">{soil.p ?? '--'}</p>
            <span className="text-[10px] text-gray-400">mg/kg</span>
          </div>
          <div className="bg-red-50 p-2.5 rounded-lg border border-red-100">
            <span className="text-xs font-bold text-red-700">Kali (K)</span>
            <p className="text-lg font-black text-red-800 mt-0.5">{soil.k ?? '--'}</p>
            <span className="text-[10px] text-gray-400">mg/kg</span>
          </div>
        </div>
      </div>

      {/* Mốc thời gian */}
      <div className="text-center text-[11px] text-gray-400 font-medium">
        Lần đo cuối: {recordedAt ? new Date(recordedAt).toLocaleString('vi-VN') : 'Đang cập nhật...'}
      </div>
    </div>
  );
}