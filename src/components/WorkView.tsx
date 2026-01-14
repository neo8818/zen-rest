import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Settings, Minus, X } from 'lucide-react';

interface Props {
  timeLeft: number;
  totalTime: number;
  isActive: boolean;
  isPaused: boolean;
  currentCycle: number;
  totalCycles: number;
  onToggle: () => void;
  onReset: () => void;
  onOpenSettings: () => void;
}

const invoke = window.__TAURI__?.core?.invoke;

export default function WorkView({
  timeLeft,
  totalTime,
  isActive,
  isPaused,
  currentCycle,
  totalCycles,
  onToggle,
  onReset,
  onOpenSettings,
}: Props) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / totalTime;
  const dashOffset = circumference * (1 - progress);

  const handleMinimize = () => invoke?.('minimize_to_tray');
  const handleClose = () => invoke?.('quit_app');

  const cycleText = totalCycles > 0 
    ? `第 ${currentCycle}/${totalCycles} 轮` 
    : `第 ${currentCycle} 轮`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col"
    >
      {/* 标题栏 */}
      <div className="drag-region flex justify-between items-center px-5 py-4">
        <span className="text-white/40 text-sm font-medium tracking-wide">Zen Rest</span>
        <div className="flex gap-1 no-drag">
          <button
            onClick={onOpenSettings}
            className="p-2 text-white/30 hover:text-white/70 hover:bg-white/5 rounded-lg transition-all"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={handleMinimize}
            className="p-2 text-white/30 hover:text-white/70 hover:bg-white/5 rounded-lg transition-all"
          >
            <Minus size={16} />
          </button>
          <button
            onClick={handleClose}
            className="p-2 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 暂停提示 */}
      {isPaused && isActive && (
        <div className="mx-5 mb-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400/80 text-xs text-center">
          已暂停 · Ctrl+Alt+P 恢复
        </div>
      )}

      {/* 主内容 */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-6">
        {/* 圆环计时器 */}
        <div className="relative mb-8">
          <svg width="320" height="320" className="transform -rotate-90">
            {/* 背景轨道 */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-white/5"
            />
            {/* 进度条 - 琥珀色渐变 */}
            <motion.circle
              cx="160"
              cy="160"
              r={radius}
              stroke="url(#amberGradient)"
              strokeWidth="6"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="amberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
          </svg>

          {/* 中心内容 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-extralight tracking-tight text-white tabular-nums">
              {formatTime(timeLeft)}
            </span>
            <span className="text-white/30 text-sm mt-2 font-medium">
              {isPaused ? '已暂停' : isActive ? '专注中' : '准备开始'}
            </span>
            {isActive && (
              <span className="text-white/20 text-xs mt-1">{cycleText}</span>
            )}
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center gap-3">
          {isActive && (
            <button
              onClick={onReset}
              className="p-3 text-white/40 hover:text-white/70 hover:bg-white/5 rounded-xl transition-all"
            >
              <RotateCcw size={20} />
            </button>
          )}
          
          <button
            onClick={onToggle}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/20 rounded-2xl transition-all active:scale-95"
          >
            {isActive ? (
              <>
                <Pause size={18} className="text-amber-400" />
                <span className="text-amber-100 font-medium">暂停</span>
              </>
            ) : (
              <>
                <Play size={18} className="text-amber-400" />
                <span className="text-amber-100 font-medium">开始专注</span>
              </>
            )}
          </button>
        </div>

        {/* 底部提示 */}
        <div className="mt-auto pt-6 text-center">
          <p className="text-white/20 text-xs">
            Ctrl+Alt+P 暂停 · Ctrl+Alt+Q 跳过休息
          </p>
        </div>
      </div>
    </motion.div>
  );
}
