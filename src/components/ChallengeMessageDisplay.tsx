import { Shuffle, Sparkles, MessageSquareQuote, Check, AlertCircle } from 'lucide-react';
import { soundFX } from '../lib/audioFeedback';

interface ChallengeMessageDisplayProps {
  targetMessage: string;
  typedText: string;
  onShuffleMessage: () => void;
  disabled?: boolean;
}

export function ChallengeMessageDisplay({
  targetMessage,
  typedText,
  onShuffleMessage,
  disabled = false,
}: ChallengeMessageDisplayProps) {
  const targetChars = targetMessage.split('');
  const typedChars = typedText.split('');

  const wordCount = targetMessage.trim().split(/\s+/).length;
  const isComplete = typedText === targetMessage;

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-sm shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <MessageSquareQuote className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
            Dynamic Challenge Message (Changes Each Attempt)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            {targetMessage.length} chars • {wordCount} words
          </span>

          <button
            type="button"
            id="shuffle-message-btn"
            disabled={disabled}
            onClick={() => {
              soundFX.playKeypress(650);
              onShuffleMessage();
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-cyan-300 text-xs font-mono border border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-40"
            title="Generate a new random challenge message"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>New Message</span>
          </button>
        </div>
      </div>

      {/* Interactive Text Display with Live Typing Progress */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 flex flex-wrap items-center gap-y-1 font-mono text-base sm:text-lg leading-relaxed select-none min-h-[72px]">
        {targetChars.map((char, index) => {
          const typedChar = typedChars[index];
          const hasTyped = index < typedChars.length;
          const isCorrect = hasTyped && typedChar === char;
          const isError = hasTyped && typedChar !== char;
          const isCursor = index === typedChars.length;

          let colorClass = 'text-slate-500';
          let bgClass = '';

          if (isCorrect) {
            colorClass = 'text-cyan-300 font-semibold';
            bgClass = char === ' ' ? 'bg-cyan-950/60' : '';
          } else if (isError) {
            colorClass = 'text-rose-400 font-bold underline decoration-rose-500';
            bgClass = 'bg-rose-950/80';
          } else if (isCursor) {
            colorClass = 'text-slate-100 font-bold';
            bgClass = 'bg-cyan-500/20 ring-1 ring-cyan-400 rounded-xs animate-pulse';
          }

          return (
            <span
              key={index}
              className={`relative px-0.5 py-0.2 rounded transition-all duration-75 ${colorClass} ${bgClass}`}
            >
              {char === ' ' ? '␣' : char}
              {isCursor && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-cyan-400 animate-pulse" />
              )}
            </span>
          );
        })}

        {isComplete && (
          <span className="ml-2 inline-flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full animate-bounce">
            <Check className="w-3 h-3" />
            <span>Matched</span>
          </span>
        )}
      </div>

      {/* Guidance Note */}
      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Type naturally. TypingDNA records your biological keystroke rhythm.</span>
        </div>
        <div>
          Progress: <strong className="text-cyan-300">{typedText.length}</strong> / {targetMessage.length}
        </div>
      </div>
    </div>
  );
}
