import React, { useRef, useEffect } from 'react';
import { Eye, EyeOff, Delete, Sparkles, KeyRound } from 'lucide-react';
import { KeystrokeMetric, PasscodeMode } from '../types';
import { soundFX } from '../lib/audioFeedback';

interface PasscodeDisplayProps {
  passcode: string;
  expectedLength: number;
  mode: PasscodeMode;
  showPasscode: boolean;
  setShowPasscode: (show: boolean) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyUp: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClear: () => void;
  keystrokes: KeystrokeMetric[];
  inputRef: React.RefObject<HTMLInputElement | null>;
  disabled?: boolean;
  label?: string;
  isVerifying?: boolean;
}

export function PasscodeDisplay({
  passcode,
  expectedLength,
  mode,
  showPasscode,
  setShowPasscode,
  onKeyDown,
  onKeyUp,
  onClear,
  keystrokes,
  inputRef,
  disabled = false,
  label = 'Enter Passcode',
  isVerifying = false,
}: PasscodeDisplayProps) {
  const isPin = mode === 'pin4' || mode === 'pin6';

  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hidden real input that receives hardware typing and TypingDNA target hooks */}
      <input
        id="passcode-input"
        ref={inputRef}
        type={isPin ? 'tel' : 'text'}
        value={passcode}
        onChange={() => {}} // Controlled by onKeyDown/onKeyUp handlers
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        disabled={disabled}
        autoFocus
        autoComplete="off"
        className="opacity-0 absolute -z-10 pointer-events-none w-0 h-0"
      />

      {/* Label and Visibility Switch */}
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="toggle-mask-btn"
            onClick={() => setShowPasscode(!showPasscode)}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors px-2 py-1 rounded bg-slate-900 border border-slate-800"
          >
            {showPasscode ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mask</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>Reveal</span>
              </>
            )}
          </button>

          {passcode.length > 0 && (
            <button
              type="button"
              id="clear-passcode-btn"
              onClick={() => {
                soundFX.playKeypress(350);
                onClear();
              }}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors px-2 py-1 rounded bg-slate-900 border border-slate-800"
            >
              <Delete className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Input Display Area */}
      <div
        onClick={handleContainerClick}
        className={`w-full cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
          isVerifying
            ? 'border-cyan-500/60 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
        }`}
      >
        {isPin ? (
          /* PIN Boxes Grid */
          <div className="flex items-center justify-center gap-2.5 sm:gap-3.5">
            {Array.from({ length: expectedLength }).map((_, index) => {
              const char = passcode[index];
              const isFilled = Boolean(char);
              const isCurrent = index === passcode.length;
              const metric = keystrokes[index];

              return (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className={`w-12 h-14 sm:w-14 sm:h-16 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-bold font-mono transition-all duration-150 ${
                      isFilled
                        ? 'border-2 border-cyan-500/80 bg-slate-900 text-cyan-300 shadow-md shadow-cyan-500/20'
                        : isCurrent
                        ? 'border-2 border-cyan-400/50 bg-slate-900/90 text-slate-500 ring-2 ring-cyan-500/20 animate-pulse'
                        : 'border border-slate-800 bg-slate-950/80 text-slate-600'
                    }`}
                  >
                    {isFilled ? (
                      showPasscode ? (
                        char
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></span>
                      )
                    ) : isCurrent ? (
                      <span className="w-0.5 h-6 bg-cyan-400 animate-ping"></span>
                    ) : (
                      <span className="text-slate-700 font-light">•</span>
                    )}
                  </div>

                  {/* Micro Keystroke Timing Pill */}
                  <div className="h-5 mt-1.5 flex items-center justify-center">
                    {metric ? (
                      <span className="text-[10px] font-mono text-cyan-400/90 bg-cyan-950/80 border border-cyan-800/60 px-1 py-0.2 rounded">
                        {metric.pressTime}ms
                      </span>
                    ) : isCurrent ? (
                      <span className="text-[9px] font-mono text-slate-500">
                        {index === 0 ? 'start' : 'await'}
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-slate-700">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Custom Alphanumeric Passcode Input */
          <div className="flex flex-col items-center">
            <div className="w-full flex items-center justify-center min-h-[56px] px-4 py-2 border border-slate-800 bg-slate-950 rounded-xl font-mono text-lg sm:text-xl tracking-widest text-cyan-300">
              {passcode.length > 0 ? (
                showPasscode ? (
                  passcode
                ) : (
                  '•'.repeat(passcode.length)
                )
              ) : (
                <span className="text-slate-600 font-sans text-sm tracking-normal">
                  Type alphanumeric passcode...
                </span>
              )}
              <span className="w-0.5 h-5 ml-1 bg-cyan-400 animate-pulse"></span>
            </div>

            {/* Keystrokes timeline pills */}
            <div className="w-full overflow-x-auto flex items-center gap-1 mt-2 pb-1 justify-center">
              {keystrokes.map((k, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-mono bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 px-1.5 py-0.5 rounded whitespace-nowrap"
                >
                  {k.key}: {k.pressTime}ms {k.seekTime > 0 ? `(+${k.seekTime}ms)` : ''}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TypingDNA Live Recording Indicator */}
      <div className="w-full flex items-center justify-between text-[11px] text-slate-400 mt-2 px-2">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span>TypingDNA capturing dwell ($T_{'{press}'}$) & flight ($T_{'{seek}'}$)</span>
        </div>
        <div className="font-mono text-slate-400">
          {keystrokes.length} keystroke{keystrokes.length === 1 ? '' : 's'}
        </div>
      </div>
    </div>
  );
}
