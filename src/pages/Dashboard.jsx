import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('Checking');
  
  // Địa chỉ MAC cố định của mạch ESP32 Farmizy Node 1
  const macAddress = "68:FE:71:87:10:2C";

  useEffect(() => {
    // 1. Khởi tạo dữ liệu ban đầu
    fetchLatestTelemetry();

    // 2. Thiết lập kênh lắng nghe thời gian thực (Real-time Subscription)
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
          console.log('⚡ Dữ liệu mới từ vườn:', payload.new);
          if (payload.new && payload.new.payload) {
            setTelemetry(payload.new.payload);
            setConnectionStatus('Online');
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('Online');
        }
      });

    // Clean up channel khi component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLatestTelemetry = async () => {
    try {
      const { data, error } = await supabase
        .from('telemetry_logs')
        .select('payload, created_at')
        .eq('mac_address', macAddress)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Lỗi truy vấn Supabase:', error);
      }

      if (data) {
        setTelemetry(data.payload);
      }
    } catch (err) {
      console.error('Lỗi kết nối:', err);
    } finally {
      setLoading(false);
    }
  };

  // Đánh giá chỉ số độ ẩm đất để đưa ra khuyến nghị nhanh cho nhà nông
  const getSoilStatus = (hum) => {
    if (!hum && hum !== 0) return { label: 'Chưa có dữ liệu', color: 'bg-gray-100 text-gray-600' };
    if (hum < 40) return { label: 'Đất khô - Cần tưới ngay!', color: 'bg-red-100 text-red-700 border-red-300' };
    if (hum > 80) return { label: 'Đất quá ẩm - Dừng tưới', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    return { label: 'Độ ẩm lý tưởng', color: 'bg-green-100 text-green-700 border-green-300' };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <div className="w-10 h-10 border-4 border-farmGreen border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-bold">Đang kết nối dữ liệu vườn...</p>
      </div>
    );
  }

  const soilStatus = getSoilStatus(telemetry?.soil?.hum);

  return (
    <div className="space-y-5 max-w-md mx-auto">
      {/* Header & Trạng thái kết nối */}
      <div className="flex justify-between items-center border-b pb-3 border-gray-200">
        <div>
          <h1 className="text-xl font-black text-gray-800">🌱 Trạm Cảm Biến Sầu Riêng</h1>
          <p className="text-xs text-gray-500 font-medium">MAC: {macAddress}</p>
        </div>
        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
          connectionStatus === 'Online' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          ● {connectionStatus}
        </span>
      </div>

      {/* Cảnh báo trạng thái đất */}
      <div className={`p-3.5 rounded-xl border font-bold text-sm text-center shadow-sm ${soilStatus.color}`}>
        {soilStatus.label}
      </div>

      {/* Grid hiển thị các thông số cảm biến */}
      <div className="grid grid-cols-2 gap-4">
        {/* Thẻ Độ Ẩm Đất */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">💧</span>
            <span className="text-xs font-bold text-gray-500 uppercase">Độ Ẩm Đất</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-gray-800">{telemetry?.soil?.hum ?? '--'}</span>
            <span className="text-sm font-bold text-gray-500 ml-1">%</span>
          </div>
        </div>

        {/* Thẻ Nhiệt Độ Đất */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🌡️</span>
            <span className="text-xs font-bold text-gray-500 uppercase">Nhiệt Độ Đất</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-gray-800">{telemetry?.soil?.tmp ?? '--'}</span>
            <span className="text-sm font-bold text-gray-500 ml-1">°C</span>
          </div>
        </div>

        {/* Thẻ Nồng Độ pH */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🧪</span>
            <span className="text-xs font-bold text-gray-500 uppercase">Độ pH Đất</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-gray-800">{telemetry?.soil?.ph ?? '--'}</span>
          </div>
        </div>

        {/* Thẻ Dẫn Điện EC */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">⚡</span>
            <span className="text-xs font-bold text-gray-500 uppercase">Dẫn Điện EC</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-gray-800">{telemetry?.soil?.ec ?? '--'}</span>
            <span className="text-xs font-bold text-gray-500 ml-1">uS/cm</span>
          </div>
        </div>
      </div>

      {/* Thông tin thời gian cập nhật */}
      <div className="text-center text-xs text-gray-400 font-medium pt-2">
        Tự động cập nhật qua Supabase Real-time Engine
      </div>
    </div>
  );
}