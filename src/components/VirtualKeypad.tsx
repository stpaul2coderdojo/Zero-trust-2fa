import { useState } from 'react';
import { Delete, CornerDownLeft, Space } from 'lucide-react';
import { soundFX } from '../lib/audioFeedback';

interface VirtualKeypadProps {
  onKeyPress: (key: string, keyCode: number) => void;
  onBackspace: () => void;
  onSubmit?: () => void;
  disabled?: boolean;
  canSubmit?: boolean;
  isTextMode?: boolean;
}

export function VirtualKeypad({
  onKeyPress,
  onBackspace,
  onSubmit,
  disabled = false,
  canSubmit = false,
  isTextMode = false,
}: VirtualKeypadProps) {
  const [layout, setLayout] = useState<'num' | 'alpha'>(isTextMode ? 'alpha' : 'num');

  const handleKeyClick = (key: string, keyCode: number) => {
    if (disabled) return;
    soundFX.playKeypress(450 + keyCode * 3);
    onKeyPress(key, keyCode);
  };

  const numKeys = [
    { label: '1', code: 49, sub: '' },
    { label: '2', code: 50, sub: 'ABC' },
    { label: '3', code: 51, sub: 'DEF' },
    { label: '4', code: 52, sub: 'GHI' },
    { label: '5', code: 53, sub: 'JKL' },
    { label: '6', code: 54, sub: 'MNO' },
    { label: '7', code: 55, sub: 'PQRS' },
    { label: '8', code: 56, sub: 'TUV' },
    { label: '9', code: 57, sub: 'WXYZ' },
  ];

  const qwertyRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ];

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center">
      {/* Layout switch for alphanumeric messages */}
      <div className="flex items-center justify-between w-full max-w-xs mb-2 text-xs font-mono">
        <span className="text-slate-500 text-[11px]">Virtual Keypad</span>
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setLayout('num')}
            className={`px-2 py-0.5 rounded text-[10px] ${
              layout === 'num' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-500'
            }`}
          >
            123
          </button>
          <button
            type="button"
            onClick={() => setLayout('alpha')}
            className={`px-2 py-0.5 rounded text-[10px] ${
              layout === 'alpha' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-500'
            }`}
          >
            ABC
          </button>
        </div>
      </div>

      {layout === 'num' ? (
        /* Numeric Grid */
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-xs">
          {numKeys.map((k) => (
            <button
              key={k.label}
              type="button"
              id={`keypad-${k.label}`}
              disabled={disabled}
              onClick={() => handleKeyClick(k.label, k.code)}
              className="h-13 sm:h-15 rounded-2xl bg-slate-900/90 hover:bg-slate-850 active:bg-cyan-950/60 active:scale-95 border border-slate-800 hover:border-slate-700 text-slate-100 font-semibold transition-all flex flex-col items-center justify-center select-none shadow-sm disabled:opacity-40 disabled:pointer-events-none group"
            >
              <span className="text-lg sm:text-xl font-mono text-slate-200 group-hover:text-cyan-300">
                {k.label}
              </span>
              {k.sub && (
                <span className="text-[8px] font-mono tracking-widest text-slate-500 group-hover:text-slate-400">
                  {k.sub}
                </span>
              )}
            </button>
          ))}

          {/* Backspace Button */}
          <button
            type="button"
            id="keypad-backspace"
            disabled={disabled}
            onClick={() => {
              soundFX.playKeypress(350);
              onBackspace();
            }}
            className="h-13 sm:h-15 rounded-2xl bg-slate-900/50 hover:bg-slate-800 active:bg-rose-950/60 active:scale-95 border border-slate-800/80 text-slate-400 hover:text-rose-400 transition-all flex items-center justify-center select-none disabled:opacity-40 disabled:pointer-events-none"
          >
            <Delete className="w-5 h-5" />
          </button>

          {/* 0 Key */}
          <button
            type="button"
            id="keypad-0"
            disabled={disabled}
            onClick={() => handleKeyClick('0', 48)}
            className="h-13 sm:h-15 rounded-2xl bg-slate-900/90 hover:bg-slate-850 active:bg-cyan-950/60 active:scale-95 border border-slate-800 hover:border-slate-700 text-slate-100 font-semibold transition-all flex flex-col items-center justify-center select-none shadow-sm disabled:opacity-40 disabled:pointer-events-none group"
          >
            <span className="text-lg sm:text-xl font-mono text-slate-200 group-hover:text-cyan-300">
              0
            </span>
          </button>

          {/* Submit */}
          <button
            type="button"
            id="keypad-submit"
            disabled={disabled || !canSubmit}
            onClick={() => {
              if (onSubmit) {
                soundFX.playKeypress(700);
                onSubmit();
              }
            }}
            className={`h-13 sm:h-15 rounded-2xl border transition-all flex items-center justify-center select-none ${
              canSubmit
                ? 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-lg shadow-cyan-500/20 active:scale-95'
                : 'bg-slate-900/40 border-slate-800/60 text-slate-600 cursor-not-allowed'
            }`}
          >
            <CornerDownLeft className="w-5 h-5" />
          </button>
        </div>
      ) : (
        /* QWERTY Text Grid */
        <div className="w-full space-y-1.5">
          {qwertyRows.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5">
              {row.map((char) => (
                <button
                  key={char}
                  type="button"
                  id={`keypad-char-${char}`}
                  disabled={disabled}
                  onClick={() => handleKeyClick(char, char.toUpperCase().charCodeAt(0))}
                  className="w-8 sm:w-10 h-10 sm:h-11 rounded-xl bg-slate-900/90 hover:bg-slate-800 active:bg-cyan-950 active:scale-95 border border-slate-800 text-slate-200 font-mono text-xs sm:text-sm font-semibold transition-all flex items-center justify-center select-none disabled:opacity-40"
                >
                  {char}
                </button>
              ))}
            </div>
          ))}

          {/* Space and Control Row */}
          <div className="flex justify-center items-center gap-1.5 pt-1">
            <button
              type="button"
              id="keypad-alpha-backspace"
              disabled={disabled}
              onClick={() => {
                soundFX.playKeypress(350);
                onBackspace();
              }}
              className="px-3 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 text-xs font-mono flex items-center gap-1"
            >
              <Delete className="w-4 h-4" />
            </button>

            <button
              type="button"
              id="keypad-space"
              disabled={disabled}
              onClick={() => handleKeyClick(' ', 32)}
              className="flex-1 max-w-xs h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 active:bg-cyan-950 text-slate-300 border border-slate-800 text-xs font-mono flex items-center justify-center gap-1"
            >
              <Space className="w-4 h-4 text-slate-500" />
              <span>Space</span>
            </button>

            <button
              type="button"
              id="keypad-alpha-submit"
              disabled={disabled || !canSubmit}
              onClick={() => {
                if (onSubmit) {
                  soundFX.playKeypress(700);
                  onSubmit();
                }
              }}
              className={`px-3 h-10 rounded-xl border text-xs font-mono font-bold flex items-center gap-1 ${
                canSubmit
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/40 border-slate-800/60 text-slate-600 cursor-not-allowed'
              }`}
            >
              <CornerDownLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-500 mt-2.5 text-center font-mono">
        Hardware keyboard provides exact natural millisecond typing dynamics
      </p>
    </div>
  );
}
