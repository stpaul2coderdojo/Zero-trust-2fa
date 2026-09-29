import { useState } from 'react';
import { Terminal, Copy, Check, Info, Code, FileText } from 'lucide-react';

interface RawPatternInspectorProps {
  rawPattern: string;
  passcode: string;
  source?: string;
}

export function RawPatternInspector({ rawPattern, passcode, source = 'TypingDNA Recorder v3.2' }: RawPatternInspectorProps) {
  const [copied, setCopied] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleCopy = () => {
    if (!rawPattern) return;
    navigator.clipboard.writeText(rawPattern).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Parse pattern segments if available
  const hasPipe = rawPattern && rawPattern.includes('|');
  const [headerPart, dataPart] = hasPipe ? rawPattern.split('|') : [rawPattern, ''];
  const headerFields = headerPart ? headerPart.split(',') : [];

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-sm shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
            Raw TypingDNA Pattern Inspector (GitHub format)
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{showExplanation ? 'Hide Spec' : 'Pattern Spec'}</span>
          </button>

          <button
            type="button"
            id="copy-raw-pattern-btn"
            disabled={!rawPattern}
            onClick={handleCopy}
            className="text-xs text-slate-200 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors disabled:opacity-40"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-mono">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">Copy String</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pattern String Box */}
      <div className="my-3 p-3 bg-slate-950 rounded-xl border border-slate-800/90 font-mono text-xs overflow-x-auto text-cyan-300/90 selection:bg-cyan-500/30 selection:text-white leading-relaxed break-all">
        {rawPattern ? (
          <div>
            <span className="text-emerald-400 font-bold">{headerPart}</span>
            {hasPipe && (
              <>
                <span className="text-rose-400 font-bold px-0.5">|</span>
                <span className="text-cyan-200">{dataPart}</span>
              </>
            )}
          </div>
        ) : (
          <span className="text-slate-600">
            No pattern recorded yet. Type the passcode above to capture a TypingDNA biometric pattern.
          </span>
        )}
      </div>

      {/* Breakdown Specification */}
      {showExplanation && (
        <div className="mt-4 p-4 rounded-xl bg-slate-950/90 border border-cyan-900/40 text-xs text-slate-300 space-y-3">
          <div className="flex items-center gap-2 font-mono text-cyan-300 font-semibold">
            <Code className="w-4 h-4" />
            <span>TypingDNA Pattern Architecture (from TypingDnaRecorder-JavaScript)</span>
          </div>

          <p className="text-slate-400 leading-normal">
            TypingDNA encodes biometric typing behavior into a standardized string split into two sections by a pipe character (<code className="text-rose-400 font-mono">|</code>):
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-emerald-400 font-bold block mb-1">1. Header (Metadata & Environment)</span>
              <ul className="list-disc list-inside text-slate-400 space-y-1">
                <li><strong className="text-slate-200">Indices 0-1:</strong> Pattern type & API version (3.2)</li>
                <li><strong className="text-slate-200">Index 4:</strong> Keystrokes length count</li>
                <li><strong className="text-slate-200">Index 5:</strong> FNV-1a hash of typed text</li>
                <li><strong className="text-slate-200">Tail:</strong> Screen signature & device metrics</li>
              </ul>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-cyan-400 font-bold block mb-1">2. Body (Keystroke Timings)</span>
              <ul className="list-disc list-inside text-slate-400 space-y-1">
                <li>Triplets of <code className="text-slate-200">keyCode, seekTime, pressTime</code></li>
                <li><strong className="text-slate-200">seekTime:</strong> latency since preceding key release ($T_{'{seek}'}$)</li>
                <li><strong className="text-slate-200">pressTime:</strong> duration key remained depressed ($T_{'{press}'}$)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Meta Footer */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-2">
        <span>Target: #passcode-input</span>
        <span>Source: {source}</span>
      </div>
    </div>
  );
}
