import { useState } from 'react';
import { Dna, Activity, Timer, Zap, Gauge, CheckCircle2, AlertTriangle, Fingerprint } from 'lucide-react';
import { KeystrokeMetric, TypingDnaProfile } from '../types';

interface TypingDnaVisualizerProps {
  currentKeystrokes: KeystrokeMetric[];
  enrolledProfile?: TypingDnaProfile | null;
  passcode: string;
  isVerifying?: boolean;
  quality?: number;
}

export function TypingDnaVisualizer({
  currentKeystrokes,
  enrolledProfile,
  passcode,
  isVerifying = false,
  quality = 0.85,
}: TypingDnaVisualizerProps) {
  const [activeKeyIndex, setActiveKeyIndex] = useState<number | null>(null);

  // Compute metrics from current keystrokes
  const keystrokesToDisplay = currentKeystrokes.length > 0
    ? currentKeystrokes
    : enrolledProfile?.keystrokes || [];

  const totalPress = keystrokesToDisplay.reduce((acc, k) => acc + k.pressTime, 0);
  const totalSeek = keystrokesToDisplay.reduce((acc, k) => acc + k.seekTime, 0);
  const avgPress = keystrokesToDisplay.length > 0 ? Math.round(totalPress / keystrokesToDisplay.length) : 0;
  const avgSeek = keystrokesToDisplay.length > 0 ? Math.round(totalSeek / keystrokesToDisplay.length) : 0;
  
  // WPM estimation
  const totalDurationSeconds = (totalPress + totalSeek) / 1000;
  const estimatedWPM = totalDurationSeconds > 0 && keystrokesToDisplay.length > 0
    ? Math.round((keystrokesToDisplay.length / 5) / (totalDurationSeconds / 60))
    : 0;

  // Max value for chart scaling
  const maxTime = Math.max(
    ...keystrokesToDisplay.map((k) => Math.max(k.pressTime, k.seekTime)),
    enrolledProfile ? Math.max(...enrolledProfile.keystrokes.map(k => Math.max(k.pressTime, k.seekTime))) : 0,
    220
  );

  // Bases mapping for DNA visualizer
  const getDnaBase = (press: number, seek: number) => {
    const sum = press + seek;
    const bases = [
      { code: 'A', name: 'Adenine', color: 'text-emerald-400 bg-emerald-950/70 border-emerald-700/60' },
      { code: 'T', name: 'Thymine', color: 'text-cyan-400 bg-cyan-950/70 border-cyan-700/60' },
      { code: 'C', name: 'Cytosine', color: 'text-violet-400 bg-violet-950/70 border-violet-700/60' },
      { code: 'G', name: 'Guanine', color: 'text-amber-400 bg-amber-950/70 border-amber-700/60' },
    ];
    return bases[sum % 4];
  };

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Dna className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Typing DNA Biometric Profile
            </h3>
            <p className="text-xs text-slate-400">
              Unique physiological keystroke rhythm, dwell times & flight dynamics
            </p>
          </div>
        </div>

        {/* Quality Gauge Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Strength:</span>
            <span className="text-cyan-300 font-bold">{Math.round(quality * 100)}%</span>
          </div>

          {enrolledProfile && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-xs text-emerald-300">
              <Fingerprint className="w-3.5 h-3.5" />
              <span>Enrolled Baseline</span>
            </div>
          )}
        </div>
      </div>

      {/* DNA Helical / Electrophoresis Barcode Strip */}
      <div className="my-5 p-4 rounded-xl bg-slate-950 border border-slate-800/90 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-cyan-400" />
            Biometric DNA Electrophoresis Barcode
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {keystrokesToDisplay.length} Base Nodes
          </span>
        </div>

        {keystrokesToDisplay.length === 0 ? (
          <div className="h-16 flex items-center justify-center text-xs text-slate-500 font-mono">
            Start typing to generate real-time Typing DNA sequence...
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1.5 pt-2 overflow-x-auto pb-1">
            {keystrokesToDisplay.map((k, index) => {
              const base = getDnaBase(k.pressTime, k.seekTime);
              const heightRatio = Math.min(100, Math.max(25, Math.round((k.pressTime / 180) * 100)));
              const isSelected = activeKeyIndex === index;

              return (
                <div
                  key={index}
                  onMouseEnter={() => setActiveKeyIndex(index)}
                  onMouseLeave={() => setActiveKeyIndex(null)}
                  className={`flex-1 min-w-[48px] max-w-[90px] flex flex-col items-center cursor-pointer transition-all p-1.5 rounded-lg ${
                    isSelected ? 'bg-slate-800/90 ring-1 ring-cyan-500/50' : 'hover:bg-slate-900'
                  }`}
                >
                  {/* DNA Base Pill */}
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border mb-2 ${base.color}`}>
                    {base.code}
                  </span>

                  {/* Helical Barcode Strands */}
                  <div className="w-full h-12 flex items-center justify-center gap-1 bg-slate-900/60 rounded p-1">
                    {/* Dwell bar */}
                    <div
                      style={{ height: `${heightRatio}%` }}
                      className="w-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-500/50 transition-all duration-300"
                    />
                    {/* Flight bar */}
                    <div
                      style={{ height: `${Math.min(100, Math.max(20, Math.round((k.seekTime / 250) * 100)))}%` }}
                      className="w-1.5 rounded-full bg-violet-400/80 transition-all duration-300"
                    />
                  </div>

                  {/* Character label */}
                  <span className="text-[11px] font-mono text-slate-300 mt-1 font-semibold">
                    {k.key}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Keystroke Dynamics Detailed Timing Chart */}
      <div className="my-5 p-4 rounded-xl bg-slate-950 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Keystroke Dynamics Matrix: Dwell ($T_{'{press}'}$) & Flight ($T_{'{seek}'}$)
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded bg-cyan-400"></span>
              <span className="text-slate-400">Dwell (Press Time)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded bg-violet-500"></span>
              <span className="text-slate-400">Flight (Seek Time)</span>
            </div>
            {enrolledProfile && isVerifying && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded border border-dashed border-emerald-400 bg-emerald-950/60"></span>
                <span className="text-emerald-400">Enrolled Baseline</span>
              </div>
            )}
          </div>
        </div>

        {keystrokesToDisplay.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-xs text-slate-500 font-mono">
            Keystroke timeline will appear once passcode is typed.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
            {keystrokesToDisplay.map((k, index) => {
              const enrolledKey = enrolledProfile?.keystrokes[index];
              const pressHeight = Math.min(100, Math.round((k.pressTime / maxTime) * 100));
              const seekHeight = Math.min(100, Math.round((k.seekTime / maxTime) * 100));

              let deltaPress = 0;
              let isPressMatched = true;
              if (enrolledKey) {
                deltaPress = k.pressTime - enrolledKey.pressTime;
                const diffPerc = Math.abs(deltaPress) / Math.max(enrolledKey.pressTime, 1);
                isPressMatched = diffPerc <= 0.35; // 35% natural tolerance
              }

              return (
                <div
                  key={index}
                  className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="w-6 h-6 rounded-md bg-slate-800 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center">
                      {k.key}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Visual Bar Column */}
                  <div className="h-28 flex items-end justify-center gap-2 my-2 px-1">
                    {/* Dwell bar */}
                    <div className="flex flex-col items-center flex-1 h-full justify-end">
                      <div
                        style={{ height: `${pressHeight}%` }}
                        className="w-full max-w-[18px] bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-sm shadow-sm transition-all duration-300 relative group"
                      >
                        <span className="hidden group-hover:block absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono bg-slate-950 text-cyan-300 px-1 py-0.5 rounded border border-slate-800 whitespace-nowrap z-20">
                          {k.pressTime}ms
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-300 mt-1">
                        {k.pressTime}ms
                      </span>
                      <span className="text-[8px] font-mono text-slate-500">
                        dwell
                      </span>
                    </div>

                    {/* Flight bar */}
                    <div className="flex flex-col items-center flex-1 h-full justify-end">
                      <div
                        style={{ height: `${seekHeight}%` }}
                        className="w-full max-w-[18px] bg-gradient-to-t from-violet-700 to-violet-500 rounded-t-sm shadow-sm transition-all duration-300 relative group"
                      >
                        <span className="hidden group-hover:block absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono bg-slate-950 text-violet-300 px-1 py-0.5 rounded border border-slate-800 whitespace-nowrap z-20">
                          {k.seekTime}ms
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-violet-300 mt-1">
                        {k.seekTime}ms
                      </span>
                      <span className="text-[8px] font-mono text-slate-500">
                        flight
                      </span>
                    </div>
                  </div>

                  {/* Verification Variance Tag */}
                  {enrolledKey && isVerifying && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono">
                      <span className="text-slate-500">Baseline:</span>
                      <span className={`font-semibold ${isPressMatched ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {enrolledKey.pressTime}ms ({deltaPress > 0 ? `+${deltaPress}` : deltaPress}ms)
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
            Avg Dwell Time
          </div>
          <div className="text-lg font-bold font-mono text-cyan-300 flex items-baseline gap-1">
            {avgPress} <span className="text-xs text-slate-500">ms</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Key hold depression duration
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
            Avg Flight Latency
          </div>
          <div className="text-lg font-bold font-mono text-violet-300 flex items-baseline gap-1">
            {avgSeek} <span className="text-xs text-slate-500">ms</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Inter-keystroke travel time
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
            Typing Cadence
          </div>
          <div className="text-lg font-bold font-mono text-emerald-300 flex items-baseline gap-1">
            {estimatedWPM} <span className="text-xs text-slate-500">WPM</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Overall velocity & cadence
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
            DNA Base Sequence
          </div>
          <div className="text-xs font-bold font-mono text-amber-300 truncate py-1">
            {keystrokesToDisplay.length > 0
              ? keystrokesToDisplay.map((k) => getDnaBase(k.pressTime, k.seekTime).code).join('-')
              : 'N/A'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Discrete biometric hash
          </div>
        </div>
      </div>
    </div>
  );
}
