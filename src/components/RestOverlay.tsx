import { motion } from 'framer-motion';
import { Eye, Droplets, Wind, Coffee } from 'lucide-react';

interface Props {
  timeLeft: number;
  totalTime: number;
  onSkip: () => void;
  skipShortcut: string;
}

const TIPS = [
  { icon: Eye, text: '看看远处', subtext: '让眼睛放松一下' },
  { icon: Droplets, text: '喝口水', subtext: '保持身体水分' },
  { icon: Wind, text: '深呼吸', subtext: '放松身心' },
  { icon: Coffee, text: '站起来', subtext: '活动一下筋骨' },
];

export default function RestOverlay({ timeLeft, totalTime, onSkip, skipShortcut }: Props) {
  const tipIndex = Math.floor((totalTime - timeLeft) / 5) % TIPS.length;
  const currentTip = TIPS[tipIndex];
  const TipIcon = currentTip.icon;
  const progress = (timeLeft / totalTime) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
    >
      {/* 呼吸动画背景 */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-[400px] h-[400px] bg-emerald-500 rounded-full blur-[100px]"
      />

      {/* 内容 */}
      <div className="relative z-10 flex flex-col items-center text-center px-8">
        {/* 图标 */}
        <motion.div
          key={tipIndex}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl"
        >
          <TipIcon size={40} className="text-emerald-400" />
        </motion.div>

        {/* 提示文字 */}
        <motion.div
          key={`tip-${tipIndex}`}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h2 className="text-2xl font-light text-white mb-1">{currentTip.text}</h2>
          <p className="text-white/40 text-sm">{currentTip.subtext}</p>
        </motion.div>

        {/* 倒计时 */}
        <motion.div
          key={timeLeft}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-8xl font-extralight text-emerald-400 my-10 tabular-nums"
        >
          {timeLeft}
        </motion.div>

        {/* 进度条 */}
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-400"
          />
        </div>

        {/* 跳过按钮 */}
        <button
          onClick={onSkip}
          className="mt-8 px-4 py-2 text-white/30 hover:text-white/60 text-sm transition-colors"
        >
          跳过 ({skipShortcut})
        </button>
      </div>
    </motion.div>
  );
}
