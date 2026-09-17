import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// Cấu hình danh mục 8 thiết bị ngoại vi
const RELAY_CONFIG = [
  { id: 0, name: 'Máy Bơm Tổng', desc: 'Bơm nước công suất lớn', icon: '🌊' },
  { id: 1, name: 'Van Từ Khu A', desc: 'Tưới gốc sầu riêng A', icon: '🚰' },
  { id: 2, name: 'Van Từ Khu B', desc: 'Tưới gốc sầu riêng B', icon: '🚰' },
  { id: 3, name: 'Van Từ Khu C', desc: 'Tưới gốc sầu riêng C', icon: '🚰' },
  { id: 4, name: 'Hệ Thống Châm Phân', desc: 'Hòa trộn dinh dưỡng', icon: '🧪' },
  { id: 5, name: 'Phun Sương Làm Mát', desc: 'Hạ nhiệt độ vườn', icon: '🌫️' },
  { id: 6, name: 'Đèn Chiếu Sáng', desc: 'Chiếu sáng ban đêm', icon: '💡' },
  { id: 7, name: 'Bơm Dự Phòng', desc: 'Kích hoạt khi cần thiết', icon: '⚙️' }
];

export default function Control() {
  const [relays, setRelays] = useState({});
  const [loadingRelay, setLoadingRelay] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  
  const MAC_ADDRESS = "68:FE:71:87:10:2C";
  // ĐIỀN THÔNG TIN WORKER CỦA BẠN VÀO ĐÂY
  const WORKER_URL = "https://farmizy-worker.YOUR-SUBDOMAIN.workers.dev";
  const WEBHOOK_SECRET = "YOUR_WEBHOOK_SECRET";

  useEffect(() => {
    fetchLatestRelayState();

    // Lắng nghe dữ liệu realtime từ Supabase để đồng bộ trạng thái Rơ-le
    const channel = supabase
      .channel('relay-sync')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'telemetry_logs', filter: `mac_address=eq.${MAC_ADDRESS}` },
        (payload) => {
          if (payload.new) {
            try {
              const data = typeof payload.new.payload === 'string' ? JSON.parse(payload.new.payload) : payload.new.payload;
              if (data.relays && Array.isArray(data.relays)) {
                const newState = {};
                data.relays.forEach((state, index) => { newState[`relay_${index}`] = state === 1; });
                setRelays(newState);
              }
            } catch (e) { console.error('Lỗi đồng bộ relay:', e); }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchLatestRelayState = async () => {
    try {
      const { data } = await supabase
        .from('telemetry_logs')
        .select('payload')
        .eq('mac_address', MAC_ADDRESS)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const parsed = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;
        if (parsed.relays) {
          const initialState = {};
          parsed.relays.forEach((state, index) => { initialState[`relay_${index}`] = state === 1; });
          setRelays(initialState);
        }
      }
    } catch (err) {
      console.error('Lỗi tải trạng thái ban đầu:', err);
    }
  };

  const toggleRelay = async (relayIndex, currentState) => {
    const nextState = !currentState;
    setLoadingRelay(relayIndex);
    setStatusMessage(`Đang truyền lệnh ${nextState ? 'BẬT' : 'TẮT'} rơ-le ${relayIndex}...`);

    try {
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': WEBHOOK_SECRET
        },
        body: JSON.stringify({
          action: 'control',
          mac_address: MAC_ADDRESS,
          topic: `farmizy/control/${MAC_ADDRESS}`,
          payload: { relay: relayIndex, state: nextState ? 1 : 0 }
        })
      });

      if (response.ok) {
        setRelays(prev => ({ ...prev, [`relay_${relayIndex}`]: nextState }));
        setStatusMessage('Lệnh đã được gửi thành công!');
      } else {
        throw new Error('Mạng điều khiển bận hoặc từ chối kết nối');
      }
    } catch (error) {
      console.error('Lỗi điều khiển:', error);
      setStatusMessage('Lỗi: Không thể kết nối tới thiết bị.');
    } finally {
      setLoadingRelay(null);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto p-2 pb-24">
      {/* Tiêu đề */}
      <div className="text-center pb-4 border-b">
        <h1 className="text-xl font-black text-gray-800">⚡ Điều Khiển Thiết Bị</h1>
        <p className="text-xs text-gray-500 mt-1">Tương tác trực tiếp tới tủ điều khiển ngoài vườn</p>
      </div>

      {/* Thông báo trạng thái */}
      {statusMessage && (
        <div className={`p-3 rounded-lg text-sm font-medium text-center transition-all ${
          statusMessage.includes('Lỗi') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
        }`}>
          {statusMessage}
        </div>
      )}

      {/* Cảnh báo an toàn */}
      <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-xs text-yellow-800 text-justify">
        <span className="font-bold">⚠️ Lưu ý vận hành:</span> Lệnh điều khiển được mã hóa và gửi qua EMQX Broker. Đảm bảo nguồn điện của tủ điều khiển ổn định trước khi kích hoạt các máy bơm công suất lớn.
      </div>

      {/* Lưới 8 Nút Điều Khiển */}
      <div className="grid grid-cols-1 gap-3">
        {RELAY_CONFIG.map((relay) => {
          const isPowerOn = relays[`relay_${relay.id}`] || false;
          const isLoading = loadingRelay === relay.id;

          return (
            <div key={relay.id} className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isPowerOn ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {relay.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">{relay.name}</h3>
                  <p className="text-[11px] text-gray-400">Rơ-le số {relay.id} • {relay.desc}</p>
                </div>
              </div>
              
              <button
                onClick={() => toggleRelay(relay.id, isPowerOn)}
                disabled={isLoading}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
                  isPowerOn ? 'bg-blue-600' : 'bg-gray-200'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  isPowerOn ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}