import { Dna, Activity, Fingerprint, Shield, Cpu, Zap, Compass, CheckCircle2 } from 'lucide-react';
import { TypingDnaProfile } from '../types';
import { TypingDnaVisualizer } from './TypingDnaVisualizer';
import { RawPatternInspector } from './RawPatternInspector';

interface AnalyticsViewProps {
  enrolledProfile: TypingDnaProfile | null;
  onNavigateToEnroll: () => void;
}

export function AnalyticsView({ enrolledProfile, onNavigateToEnroll }: AnalyticsViewProps) {
  if (!enrolledProfile) {
    return (
      <div className="w-full max-w-2xl mx-auto p-12 text-center bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-sm">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-4">
          <Dna className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-slate-100 font-mono">
          No Typing DNA Enrolled Yet
        </h3>
        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
          Enroll a passcode profile to visualize your comprehensive keystroke dynamics, electrophoretic barcode strands, and biometric timing matrix.
        </p>
        <button
          type="button"
          onClick={onNavigateToEnroll}
          className="mt-6 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs transition-colors"
        >
          Enroll Biometrics Now
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Comprehensive Visualizer */}
      <TypingDnaVisualizer
        currentKeystrokes={enrolledProfile.keystrokes}
        enrolledProfile={enrolledProfile}
        passcode={enrolledProfile.passcode}
        quality={enrolledProfile.quality}
      />

      {/* Biometric Analysis Details Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Biometric Physiological Breakdown
            </h3>
            <p className="text-xs text-slate-400">
              Why TypingDNA keystroke biometrics enables frictionless passwordless security
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold">
              <Cpu className="w-4 h-4" />
              <span>Neuromuscular Memory</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Every person possesses unique finger bone lengths, muscular tension, and reflex speeds, creating a distinctive subconscious cadence when entering familiar passcodes.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold">
              <Shield className="w-4 h-4" />
              <span>Zero Credential Theft</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Even if an adversary shoulder-surfs or intercepts the plain passcode digits, they cannot replicate your sub-millisecond dwell times ($T_{'{press}'}$) and flight transitions ($T_{'{seek}'}$).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-violet-400 font-mono font-bold">
              <Zap className="w-4 h-4" />
              <span>Statistical Stabilization</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Enrolling across {enrolledProfile.samplesCount} samples averages natural biometric variance, establishing a stable centroid vector for accurate false-acceptance (FAR) and false-rejection (FRR) rates.
            </p>
          </div>
        </div>

        {/* Keystrokes Table */}
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-xs font-mono font-semibold text-slate-300">
            Enrolled Keystroke Timing Table
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-2">Index</th>
                  <th className="px-4 py-2">Key Character</th>
                  <th className="px-4 py-2">Key Code</th>
                  <th className="px-4 py-2">Dwell Time ($T_{'{press}'}$)</th>
                  <th className="px-4 py-2">Flight Time ($T_{'{seek}'}$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {enrolledProfile.keystrokes.map((k, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="px-4 py-2.5 text-slate-500">#{idx + 1}</td>
                    <td className="px-4 py-2.5 font-bold text-cyan-300">{k.key}</td>
                    <td className="px-4 py-2.5 text-slate-400">{k.keyCode}</td>
                    <td className="px-4 py-2.5 text-emerald-400 font-semibold">{k.pressTime} ms</td>
                    <td className="px-4 py-2.5 text-violet-400 font-semibold">{k.seekTime} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <RawPatternInspector
          rawPattern={enrolledProfile.rawPattern}
          passcode={enrolledProfile.passcode}
          source="Enrolled TypingDNA Profile"
        />
      </div>
    </div>
  );
}
