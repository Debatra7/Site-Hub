'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/** Fixed-width placeholders so SSR and the first client paint match exactly. */
const PLACEHOLDER_HM = '00:00';
const PLACEHOLDER_S = '00';
const PLACEHOLDER_DATE = '\u2014';

function formatHM(d: Date) {
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function formatSeconds(d: Date) {
  return d.getSeconds().toString().padStart(2, '0');
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function Digit({ value, className }: { value: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className ?? ''}`}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

interface ClockProps {
  themeColor: string;
  /** Smaller layout for draggable home widget */
  compact?: boolean;
}

export function Clock({ themeColor, compact }: ClockProps) {
  const [time, setTime] = React.useState<Date | null>(null);

  React.useEffect(() => {
    queueMicrotask(() => setTime(new Date()));
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time ? formatHM(time) : PLACEHOLDER_HM;
  const seconds = time ? formatSeconds(time) : PLACEHOLDER_S;
  const date = time ? formatDate(time) : PLACEHOLDER_DATE;

  if (compact) {
    return (
      <div data-ctx="clock" className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 py-1">
        <div
          className="pointer-events-none absolute inset-0 rounded-xl opacity-20 blur-2xl"
          style={{ backgroundColor: themeColor }}
        />
        <div className="relative flex items-baseline gap-2 tabular-nums text-white">
          <span className="text-4xl font-extralight tracking-tight">{timeString}</span>
          <span className="text-lg font-light text-white/40">{seconds}</span>
        </div>
        <p className="relative text-center text-[10px] font-bold tracking-[0.35em] text-white/35 uppercase">
          {date}
        </p>
      </div>
    );
  }

  return (
    <div data-ctx="clock" className="pointer-events-auto relative flex flex-col items-center">
      <div
        className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.12] blur-[120px] transition-colors duration-1000"
        style={{ backgroundColor: themeColor }}
      />

      <div className="relative flex flex-col items-center">
        <div className="flex items-baseline">
          <div className="flex text-[10rem] leading-none font-thin tracking-[-0.05em] whitespace-nowrap text-white tabular-nums">
            {timeString.split('').map((char, i) => (
              <Digit key={`t-${i}`} value={char} />
            ))}
          </div>

          <div className="ml-6 flex text-4xl font-extralight tracking-widest text-white opacity-20 tabular-nums">
            {seconds.split('').map((char, i) => (
              <Digit key={`s-${i}`} value={char} />
            ))}
          </div>
        </div>

        <div className="mt-8 flex min-h-4 items-center gap-8">
          <span className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <p className="text-xs font-bold tracking-[1em] text-white/30 uppercase whitespace-nowrap">{date}</p>
          <span className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      </div>
    </div>
  );
}
