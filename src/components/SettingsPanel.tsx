import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Timer, Repeat, Zap, Keyboard } from 'lucide-react';
import type { Settings } from '../App';

interface Props {
  settings: Settings;
  onSave: (settings: Settings) => void;
  onClose: () => void;
}

// 快捷键录入组件
function ShortcutInput({ 
  value, 
  onChange, 
  label 
}: { 
  value: string; 
  onChange: (v: string) => void; 
  label: string;
}) {
  const [recording, setRecording] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!recording) return;
    e.preventDefault();
    
    const parts: string[] = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');
    
    // 只接受字母键
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      parts.push(e.key.toUpperCase());
      onChange(parts.join('+'));
      setRecording(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-white/60 text-sm">{label}</span>
      <button
        onClick={() => setRecording(true)}
        onKeyDown={handleKeyDown}
        onBlur={() => setRecording(false)}
        className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-all ${
          recording 
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' 
            : 'bg-white/5 text-white/70 hover:bg-white/10'
        }`}
      >
        {recording ? '按下快捷键...' : value}
      </button>
    </div>
  );
}

export default function SettingsPanel({ settings, onSave, onClose }: Props) {
  const [form, setForm] = useState(settings);

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  const presets = [
    { name: '番茄钟', work: 25, rest: 5 * 60, cycles: 4 },
    { name: '短专注', work: 15, rest: 3 * 60, cycles: 0 },
    { name: '深度工作', work: 50, rest: 10 * 60, cycles: 2 },
    { name: '护眼模式', work: 20, rest: 20, cycles: 0 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex flex-col overflow-hidden"
    >
      {/* 标题栏 */}
      <div className="drag-region flex items-center gap-3 px-5 py-4">
        <button
          onClick={onClose}
          className="no-drag p-2 text-white/40 hover:text-white/70 hover:bg-white/5 rounded-lg transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="text-white/70 font-medium">设置</span>
      </div>

      {/* 设置内容 - 可滚动 */}
      <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-5">
        {/* 预设模式 */}
        <div>
          <h3 className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">快速预设</h3>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setForm({
                  ...form,
                  workDuration: preset.work,
                  restDuration: preset.rest,
                  totalCycles: preset.cycles,
                })}
                className="px-3 py-2 text-left bg-white/5 hover:bg-white/10 rounded-xl transition-all"
              >
                <span className="text-white/70 text-sm">{preset.name}</span>
                <span className="block text-white/30 text-xs mt-0.5">
                  {preset.work}分 / {preset.rest >= 60 ? `${preset.rest / 60}分` : `${preset.rest}秒`}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 专注时间 */}
        <div>
          <label className="flex items-center gap-2 text-white/40 text-xs font-medium uppercase tracking-wider mb-3">
            <Clock size={14} />
            专注时间（分钟）
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="120"
              value={form.workDuration}
              onChange={(e) => setForm({ ...form, workDuration: Number(e.target.value) })}
              className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-amber-500"
            />
            <input
              type="number"
              min="1"
              max="120"
              value={form.workDuration}
              onChange={(e) => setForm({ ...form, workDuration: Number(e.target.value) || 1 })}
              className="w-16 px-3 py-2 bg-white/5 rounded-xl text-white text-center text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* 休息时间 */}
        <div>
          <label className="flex items-center gap-2 text-white/40 text-xs font-medium uppercase tracking-wider mb-3">
            <Timer size={14} />
            休息时间（秒）
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="5"
              max="600"
              step="5"
              value={form.restDuration}
              onChange={(e) => setForm({ ...form, restDuration: Number(e.target.value) })}
              className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-500"
            />
            <input
              type="number"
              min="5"
              max="600"
              value={form.restDuration}
              onChange={(e) => setForm({ ...form, restDuration: Number(e.target.value) || 5 })}
              className="w-16 px-3 py-2 bg-white/5 rounded-xl text-white text-center text-sm focus:outline-none"
            />
          </div>
          <p className="text-white/20 text-xs mt-2">
            {form.restDuration >= 60 
              ? `= ${Math.floor(form.restDuration / 60)}分${form.restDuration % 60}秒`
              : `= ${form.restDuration}秒`
            }
          </p>
        </div>

        {/* 循环次数 */}
        <div>
          <label className="flex items-center gap-2 text-white/40 text-xs font-medium uppercase tracking-wider mb-3">
            <Repeat size={14} />
            循环次数
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="12"
              value={form.totalCycles}
              onChange={(e) => setForm({ ...form, totalCycles: Number(e.target.value) })}
              className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-violet-500"
            />
            <input
              type="number"
              min="0"
              max="99"
              value={form.totalCycles}
              onChange={(e) => setForm({ ...form, totalCycles: Number(e.target.value) || 0 })}
              className="w-16 px-3 py-2 bg-white/5 rounded-xl text-white text-center text-sm focus:outline-none"
            />
          </div>
          <p className="text-white/20 text-xs mt-2">
            {form.totalCycles === 0 ? '无限循环' : `共 ${form.totalCycles} 轮`}
          </p>
        </div>

        {/* 自动开始 */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-white/40" />
            <span className="text-white/60 text-sm">休息后自动开始</span>
          </div>
          <button
            onClick={() => setForm({ ...form, autoStart: !form.autoStart })}
            className={`w-12 h-6 rounded-full transition-all ${
              form.autoStart ? 'bg-amber-500' : 'bg-white/10'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                form.autoStart ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* 快捷键设置 */}
        <div>
          <label className="flex items-center gap-2 text-white/40 text-xs font-medium uppercase tracking-wider mb-3">
            <Keyboard size={14} />
            全局快捷键
          </label>
          <div className="bg-white/5 rounded-xl px-4 py-2">
            <ShortcutInput
              label="跳过休息"
              value={form.skipShortcut}
              onChange={(v) => setForm({ ...form, skipShortcut: v })}
            />
            <ShortcutInput
              label="暂停/恢复"
              value={form.pauseShortcut}
              onChange={(v) => setForm({ ...form, pauseShortcut: v })}
            />
          </div>
          <p className="text-white/20 text-xs mt-2">
            点击按钮后按下新的快捷键组合
          </p>
        </div>

        {/* 保存按钮 */}
        <button
          onClick={handleSave}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-medium rounded-xl transition-all active:scale-[0.98]"
        >
          保存设置
        </button>
      </div>
    </motion.div>
  );
}
