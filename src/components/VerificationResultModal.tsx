import { CheckCircle, XCircle, ShieldAlert, ShieldCheck, ArrowRight, RefreshCw, Dna } from 'lucide-react';
import { VerificationResult, TypingDnaProfile } from '../types';

interface VerificationResultModalProps {
  result: VerificationResult;
  enrolledProfile: TypingDnaProfile;
  onRetry: () => void;
  onClose: () => void;
}

export function VerificationResultModal({
  result,
  enrolledProfile,
  onRetry,
  onClose,
}: VerificationResultModalProps) {
  const isPassed = result.passed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-500/5 relative overflow-hidden">
        {/* Glow Header Accent */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            isPassed
              ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500'
              : 'bg-gradient-to-r from-rose-600 via-red-500 to-amber-500'
          }`}
        />

        {/* Status Icon */}
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform ${
              isPassed
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-lg shadow-rose-500/20'
            }`}
          >
            {isPassed ? (
              <ShieldCheck className="w-9 h-9" />
            ) : (
              <ShieldAlert className="w-9 h-9" />
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-slate-100 font-mono tracking-tight">
            {isPassed ? 'Biometric Authentication Passed' : 'Biometric Verification Failed'}
          </h3>

          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md">
            {isPassed
              ? 'Your physiological keystroke rhythm matches the enrolled Typing DNA signature.'
              : result.targetPasscodeMatched
              ? 'The passcode characters were correct, but the keystroke cadence and dwell timings did not match the enrolled biometric profile.'
              : 'The passcode characters entered did not match the expected enrolled passcode.'}
          </p>
        </div>

        {/* Big Score Gauge */}
        <div className="my-6 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-around">
          <div className="text-center">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-0.5">
              Biometric Match Score
            </div>
            <div
              className={`text-4xl font-extrabold font-mono tracking-tight ${
                isPassed ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {result.matchScore}%
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              Confidence: <strong className="text-slate-300">{result.confidence}</strong>
            </div>
          </div>

          <div className="h-12 w-px bg-slate-800" />

          <div className="text-center">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-0.5">
              Engine Engine
            </div>
            <div className="text-sm font-bold font-mono text-cyan-300 py-1">
              {result.source === 'cloud_api' ? 'TypingDNA Cloud API' : 'Embedded Biometrics'}
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              Quality: {Math.round(result.quality * 100)}%
            </div>
          </div>
        </div>

        {/* Detailed Metrics Breakdown */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-400">Dwell Timing Similarity:</span>
            <span className={`font-semibold ${result.details.dwellSimilarity >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {result.details.dwellSimilarity}%
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-400">Flight Latency Consistency:</span>
            <span className={`font-semibold ${result.details.flightSimilarity >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {result.details.flightSimilarity}%
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-400">Rhythm Correlation Index:</span>
            <span className={`font-semibold ${result.details.rhythmCorrelation >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {result.details.rhythmCorrelation}%
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            id="verification-retry-btn"
            onClick={onRetry}
            className="flex-1 py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-slate-950 font-bold font-mono text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Another Attempt</span>
          </button>

          <button
            type="button"
            id="verification-close-btn"
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
