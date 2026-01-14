import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import WorkView from './components/WorkView';
import RestOverlay from './components/RestOverlay';
import SettingsPanel from './components/SettingsPanel';

// Tauri API - 动态获取以确保在运行时可用
function getInvoke() {
  return window.__TAURI__?.core?.invoke;
}

function getListen() {
  return window.__TAURI__?.event?.listen;
}

// 调用 Tauri 命令的辅助函数
async function tauriInvoke<T = void>(cmd: string, args?: Record<string, unknown>): Promise<T | undefined> {
  const invoke = getInvoke();
  if (invoke) {
    try {
      const result = await invoke(cmd, args) as T;
      console.log(`[Tauri] ${cmd} 执行成功`);
      return result;
    } catch (e) {
      console.error(`[Tauri] ${cmd} 执行失败:`, e);
    }
  } else {
    console.warn('[Tauri] invoke 不可用，可能在浏览器中运行');
  }
  return undefined;
}

// 默认配置
const DEFAULT_SETTINGS = {
  workDuration: 25,      // 专注时间（分钟）
  restDuration: 20,      // 休息时间（秒）
  totalCycles: 4,        // 循环次数（0=无限）
  autoStart: false,      // 休息后自动开始下一轮
  skipShortcut: 'Ctrl+Shift+Q',    // 跳过休息快捷键
  pauseShortcut: 'Ctrl+Shift+P',   // 暂停/恢复快捷键
};

export type Settings = typeof DEFAULT_SETTINGS;

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('zen-rest-settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });
  
  const [phase, setPhase] = useState<'work' | 'rest'>('work');
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  // 保存设置
  const saveSettings = async (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem('zen-rest-settings', JSON.stringify(newSettings));
    // 如果没在运行，更新时间
    if (!isActive) {
      setTimeLeft(newSettings.workDuration * 60);
    }
    // 更新快捷键
    await tauriInvoke('update_shortcuts', {
      skipShortcut: newSettings.skipShortcut,
      pauseShortcut: newSettings.pauseShortcut,
    });
  };

  // 初始化时注册快捷键
  useEffect(() => {
    tauriInvoke('update_shortcuts', {
      skipShortcut: settings.skipShortcut,
      pauseShortcut: settings.pauseShortcut,
    });
  }, []);

  const handlePhaseSwitch = useCallback(async () => {
    if (phase === 'work') {
      setPhase('rest');
      setTimeLeft(settings.restDuration);
      // 进入休息模式 - 全屏
      await tauriInvoke('enter_rest_mode');
    } else {
      // 先退出全屏
      await tauriInvoke('exit_rest_mode');
      
      // 检查是否完成所有循环
      if (settings.totalCycles > 0 && currentCycle >= settings.totalCycles) {
        // 完成所有循环，重置
        setPhase('work');
        setTimeLeft(settings.workDuration * 60);
        setCurrentCycle(1);
        setIsActive(false);
      } else {
        // 继续下一轮
        setPhase('work');
        setTimeLeft(settings.workDuration * 60);
        setCurrentCycle(prev => prev + 1);
        setIsActive(settings.autoStart);
      }
    }
  }, [phase, settings, currentCycle]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handlePhaseSwitch();
    }

    return () => clearInterval(interval);
  }, [isActive, isPaused, timeLeft, handlePhaseSwitch]);

  // 监听 Tauri 事件
  useEffect(() => {
    let unlistenSkip: (() => void) | undefined;
    let unlistenPause: (() => void) | undefined;
    const listen = getListen();

    listen?.('force-skip', () => {
      if (phase === 'rest') {
        handlePhaseSwitch();
      }
    }).then(fn => { unlistenSkip = fn; });

    listen?.('toggle-pause', () => {
      setIsPaused(prev => !prev);
    }).then(fn => { unlistenPause = fn; });

    return () => {
      unlistenSkip?.();
      unlistenPause?.();
    };
  }, [phase, handlePhaseSwitch]);

  // 键盘快捷键（备用）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'p') {
        setIsPaused(prev => !prev);
      }
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'q' && phase === 'rest') {
        handlePhaseSwitch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, handlePhaseSwitch]);

  const toggleTimer = () => {
    if (!isActive) {
      setTimeLeft(settings.workDuration * 60);
      setCurrentCycle(1);
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    setPhase('work');
    setTimeLeft(settings.workDuration * 60);
    setCurrentCycle(1);
  };

  return (
    <div className="w-screen h-screen">
      <div className="app-container w-full h-full flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {showSettings ? (
            <SettingsPanel
              key="settings"
              settings={settings}
              onSave={saveSettings}
              onClose={() => setShowSettings(false)}
            />
          ) : phase === 'work' ? (
            <WorkView
              key="work"
              timeLeft={timeLeft}
              totalTime={settings.workDuration * 60}
              isActive={isActive}
              isPaused={isPaused}
              currentCycle={currentCycle}
              totalCycles={settings.totalCycles}
              onToggle={toggleTimer}
              onReset={resetTimer}
              onOpenSettings={() => setShowSettings(true)}
            />
          ) : (
            <RestOverlay
              key="rest"
              timeLeft={timeLeft}
              totalTime={settings.restDuration}
              onSkip={handlePhaseSwitch}
              skipShortcut={settings.skipShortcut}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
