import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Automation() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State quản lý Form tạo luật mới
  const macAddress = "68:FE:71:87:10:2C";
  const [ruleName, setRuleName] = useState('');
  const [sensorKey, setSensorKey] = useState('hum'); // hum | tmp | ph | ec
  const [operator, setOperator] = useState('<');     // < | > | =
  const [triggerValue, setTriggerValue] = useState(40);
  const [actionTarget, setActionTarget] = useState('relay_0'); // relay_0 | relay_1
  const [actionCommand, setActionCommand] = useState('on');   // on | off

  useEffect(() => {
    fetchRules();
  }, []);

  // 1. Tải danh sách các luật hiện có từ Supabase
  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('device_id', macAddress)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (err) {
      console.error('Lỗi lấy danh sách luật:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Thêm mới một luật tự động hóa
  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!ruleName.trim()) return alert('Vui lòng nhập tên kịch bản!');

    setSaving(true);
    try {
      const newRule = {
        device_id: macAddress,
        rule_name: ruleName,
        sensor_key: sensorKey,
        operator: operator,
        trigger_value: Number(triggerValue),
        action_target: actionTarget,
        action_command: actionCommand,
        is_active: true
      };

      const { data, error } = await supabase
        .from('automation_rules')
        .insert([newRule])
        .select();

      if (error) throw error;

      setRules([data[0], ...rules]);
      setRuleName(''); // Reset form
      alert('Đã thiết lập kịch bản tự động hóa thành công!');
    } catch (err) {
      console.error('Lỗi lưu luật:', err.message);
      alert('Không thể lưu luật. Kiểm tra lại kết nối Supabase.');
    } finally {
      setSaving(false);
    }
  };

  // 3. Bật / Tắt trạng thái kích hoạt của luật
  const toggleRuleStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('automation_rules')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setRules(rules.map(r => r.id === id ? { ...r, is_active: !currentStatus } : r));
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái:', err.message);
    }
  };

  // 4. Xóa luật
  const deleteRule = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa kịch bản này?')) return;
    try {
      const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRules(rules.filter(r => r.id !== id));
    } catch (err) {
      console.error('Lỗi xóa luật:', err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto p-1 pb-10">
      {/* Header */}
      <div className="border-b pb-3 border-gray-200">
        <h1 className="text-xl font-black text-gray-800">⚙️ Tự Động Hóa (IFTTT)</h1>
        <p className="text-xs text-gray-500 font-medium">Thiết lập kịch bản tưới thông minh cho vườn sầu riêng</p>
      </div>

      {/* FORM TẠO KỊCH BẢN MỚI */}
      <form onSubmit={handleAddRule} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <h2 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">➕ Thêm Kịch Bản Mới</h2>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Tên kịch bản</label>
          <input
            type="text"
            placeholder="VD: Tưới khi đất quá khô"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        {/* Cụm NẾU */}
        <div className="p-3 bg-green-50 rounded-xl border border-green-100 space-y-2">
          <span className="text-xs font-black text-green-800 uppercase">NẾU (Điều kiện):</span>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={sensorKey}
              onChange={(e) => setSensorKey(e.target.value)}
              className="p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold"
            >
              <option value="hum">Độ ẩm đất</option>
              <option value="tmp">Nhiệt độ đất</option>
              <option value="ph">Độ pH</option>
              <option value="ec">Chỉ số EC</option>
            </select>

            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-center"
            >
              <option value="<">Nhỏ hơn (&lt;)</option>
              <option value=">">Lớn hơn (&gt;)</option>
              <option value="=" font-bold>Bằng (=)</option>
            </select>

            <input
              type="number"
              value={triggerValue}
              onChange={(e) => setTriggerValue(e.target.value)}
              className="p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-center"
              required
            />
          </div>
        </div>

        {/* Cụm THÌ */}
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
          <span className="text-xs font-black text-blue-800 uppercase">THÌ (Hành động):</span>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={actionTarget}
              onChange={(e) => setActionTarget(e.target.value)}
              className="p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold"
            >
              <option value="relay_0">Máy Bơm (Rơ-le 0)</option>
              <option value="relay_1">Van Từ (Rơ-le 1)</option>
            </select>

            <select
              value={actionCommand}
              onChange={(e) => setActionCommand(e.target.value)}
              className="p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold"
            >
              <option value="on">Kích hoạt BẬT</option>
              <option value="off">Kích hoạt TẮT</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl text-sm shadow-md transition-all duration-200"
        >
          {saving ? 'Đang lưu kịch bản...' : 'LƯU KỊCH BẢN TỰ ĐỘNG'}
        </button>
      </form>

      {/* DANH SÁCH KỊCH BẢN ĐÃ CÀI ĐẶT */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">📋 Kịch Bản Đang Chạy ({rules.length})</h2>

        {loading ? (
          <div className="text-center py-6 text-xs text-gray-400 font-bold">Đang tải kịch bản...</div>
        ) : rules.length === 0 ? (
          <div className="p-4 bg-white rounded-xl border text-center text-xs text-gray-400 font-medium">
            Chưa có kịch bản nào. Hãy tạo kịch bản đầu tiên ở trên!
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="space-y-1 pr-2">
                <p className="font-extrabold text-gray-800 text-sm">{rule.rule_name}</p>
                <p className="text-xs text-gray-500 font-medium">
                  NẾU <span className="font-bold text-gray-700">{rule.sensor_key}</span> {rule.operator} <span className="font-bold text-gray-700">{rule.trigger_value}</span> THÌ <span className="font-bold text-blue-600">{rule.action_target}</span> {rule.action_command.toUpperCase()}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                {/* Nút bật/tắt kích hoạt luật */}
                <button
                  onClick={() => toggleRuleStatus(rule.id, rule.is_active)}
                  className={`px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                    rule.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {rule.is_active ? 'BẬT' : 'TẮT'}
                </button>

                {/* Nút Xóa */}
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}