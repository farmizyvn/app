import React, { useState } from 'react';

export default function Control() {
  // Trạng thái các Rơ-le (Relay 0: Bơm tưới, Relay 1: Van từ/Đèn)
  const [relays, setRelays] = useState({
    relay_0: false,
    relay_1: false
  });
  const [loadingRelay, setLoadingRelay] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Thông tin cấu hình thiết bị
  const macAddress = "68:FE:71:87:10:2C";
  const controlTopic = `farmizy/durian/node1/control`;

  // Hàm phát lệnh điều khiển qua Cloudflare Worker / EMQX API Bridge
  const toggleRelay = async (relayIndex, currentState) => {
    const nextState = !currentState;
    const relayKey = `relay_${relayIndex}`;
    
    setLoadingRelay(relayIndex);
    setStatusMessage(`Đang gửi lệnh ${nextState ? 'BẬT' : 'TẮT'}...`);

    try {
      // Gọi Worker Endpoint để chuyển tiếp lệnh xuống EMQX Cloud API an toàn
      const response = await fetch('https://farmizy-worker.YOUR-SUBDOMAIN.workers.dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': 'YOUR_WEBHOOK_SECRET' // Secret key bảo mật đã cấu hình
        },
        body: JSON.stringify({
          action: 'control',
          mac_address: macAddress,
          topic: controlTopic,
          payload: {
            relay: relayIndex,
            state: nextState ? 1 : 0
          }
        })
      });

      if (response.ok) {
        setRelays(prev => ({ ...prev, [relayKey]: nextState }));
        setStatusMessage(`Đã gửi lệnh thành công!`);
      } else {
        throw new Error('Không thể phản hồi lệnh từ server');
      }
    } catch (error) {
      console.error('Lỗi điều khiển:', error);
      setStatusMessage(`Lỗi: Không thể kết nối tới thiết bị.`);
    } finally {
      setLoadingRelay(null);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto p-1">
      {/* Tiêu đề & Cảnh báo an toàn */}
      <div className="border-b pb-3 border-gray-200">
        <h1 className="text-xl font-black text-gray-800">⚡ Điều Khiển Thiết Bị</h1>
        <p className="text-xs text-gray-500 font-medium">Tương tác trực tiếp tới tủ điều khiển ngoài vườn</p>
      </div>

      {/* Thông báo phản hồi trạng thái */}
      {statusMessage && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs text-center animate-pulse">
          {statusMessage}
        </div>
      )}

      {/* Danh sách Công tắc Rơ-le (Fat-Finger Design) */}
      <div className="space-y-4">
        
        {/* RƠ-LE 0: MÁY BƠM TƯỚI NƯỚC */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🌊</span>
              <span className="font-extrabold text-gray-800 text-base">Máy Bơm Tưới</span>
            </div>
            <p className="text-xs text-gray-400 font-medium">Rơ-le số 0 • Công suất lớn</p>
          </div>

          <button
            onClick={() => toggleRelay(0, relays.relay_0)}
            disabled={loadingRelay === 0}
            className={`w-20 h-10 flex items-center justify-center rounded-full font-black text-xs transition-all duration-300 shadow-md ${
              relays.relay_0 
                ? 'bg-green-600 text-white shadow-green-200 ring-4 ring-green-100' 
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {loadingRelay === 0 ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              relays.relay_0 ? 'ĐANG BẬT' : 'TẮT'
            )}
          </button>
        </div>

        {/* RƠ-LE 1: VAN TỪ / ĐÈN BÁO */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🚰</span>
              <span className="font-extrabold text-gray-800 text-base">Van Từ Khu A</span>
            </div>
            <p className="text-xs text-gray-400 font-medium">Rơ-le số 1 • Khóa/Mở nước</p>
          </div>

          <button
            onClick={() => toggleRelay(1, relays.relay_1)}
            disabled={loadingRelay === 1}
            className={`w-20 h-10 flex items-center justify-center rounded-full font-black text-xs transition-all duration-300 shadow-md ${
              relays.relay_1 
                ? 'bg-green-600 text-white shadow-green-200 ring-4 ring-green-100' 
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {loadingRelay === 1 ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              relays.relay_1 ? 'ĐANG BẬT' : 'TẮT'
            )}
          </button>
        </div>

      </div>

      {/* Ghi chú vận hành */}
      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800 text-xs leading-relaxed">
        <strong>⚠️ Lưu ý vận hành:</strong> Lệnh điều khiển được gửi an toàn qua EMQX Broker với chuẩn xác thực TLS. Đảm bảo nguồn điện của tủ điều khiển ổn định trước khi kích hoạt máy bơm công suất lớn.
      </div>
    </div>
  );
}