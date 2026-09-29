import { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ShieldCheck, ShieldAlert, Sparkles, UserCheck, UserX, Sliders, RefreshCw, KeyRound, Info, Shuffle, Fingerprint } from 'lucide-react';
import { UserSelector } from './UserSelector';
import { ChallengeMessageDisplay } from './ChallengeMessageDisplay';
import { PasscodeDisplay } from './PasscodeDisplay';
import { VirtualKeypad } from './VirtualKeypad';
import { TypingDnaVisualizer } from './TypingDnaVisualizer';
import { RawPatternInspector } from './RawPatternInspector';
import { VerificationResultModal } from './VerificationResultModal';
import { KeystrokeMetric, PasscodeMode, SecurityThreshold, TypingDnaProfile, VerificationResult } from '../types';
import { typingDna } from '../lib/typingDnaEngine';
import { soundFX } from '../lib/audioFeedback';
import { getRandomChallengeMessage } from '../lib/randomMessages';

interface VerificationFlowProps {
  activeUsername: string;
  onSelectUser: (username: string) => void;
  enrolledProfile: TypingDnaProfile | null;
  onNavigateToEnroll: (username?: string) => void;
  onPreloadDemoProfile: (username?: string) => void;
}

export function VerificationFlow({
  activeUsername,
  onSelectUser,
  enrolledProfile,
  onNavigateToEnroll,
  onPreloadDemoProfile,
}: VerificationFlowProps) {
  const isFirstTime = !enrolledProfile;

  // Challenge message changes each time
  const [targetMessage, setTargetMessage] = useState(() => getRandomChallengeMessage());
  const [mode, setMode] = useState<PasscodeMode>('random_message');

  const [currentInput, setCurrentInput] = useState('');
  const [showPasscode, setShowPasscode] = useState(true);
  const [threshold, setThreshold] = useState<SecurityThreshold>('normal');
  const [currentKeystrokes, setCurrentKeystrokes] = useState<KeystrokeMetric[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const activeTarget = mode === 'random_message'
    ? targetMessage
    : mode === 'pin4'
    ? '7294'
    : mode === 'pin6'
    ? '814920'
    : enrolledProfile?.passcode || 'quantum99';

  const expectedLength = activeTarget.length;

  useEffect(() => {
    typingDna.registerTarget('passcode-input');
  }, []);

  const handleShuffleChallenge = () => {
    const fresh = getRandomChallengeMessage(targetMessage);
    setTargetMessage(fresh);
    resetAttempt();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      verifyCurrentAttempt();
      return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      handleCharacterInput(e.key, e.keyCode);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key.length === 1) {
      const metric = typingDna.handleKeyUp(e.key, e.keyCode);
      if (metric) {
        setCurrentKeystrokes([...typingDna.getCurrentKeystrokes()]);
      }
    }
  };

  const handleCharacterInput = (char: string, keyCode?: number) => {
    if (currentInput.length >= expectedLength) return;

    soundFX.playKeypress(400 + char.charCodeAt(0) * 2);
    const code = keyCode || char.charCodeAt(0);
    typingDna.handleKeyDown(char, code);

    const metric = typingDna.handleKeyUp(char, code);
    const updated = currentInput + char;
    setCurrentInput(updated);

    if (metric) {
      setCurrentKeystrokes([...typingDna.getCurrentKeystrokes()]);
    }

    // Auto verify once expected length reached
    if (updated.length === expectedLength) {
      setTimeout(() => {
        verifyCurrentAttempt(updated);
      }, 350);
    }
  };

  const handleBackspace = () => {
    if (currentInput.length > 0) {
      setCurrentInput(currentInput.slice(0, -1));
      typingDna.removeLastKeystroke();
      setCurrentKeystrokes([...typingDna.getCurrentKeystrokes()]);
    }
  };

  const resetAttempt = () => {
    setCurrentInput('');
    setCurrentKeystrokes([]);
    typingDna.resetRecorder();
    if (inputRef.current) inputRef.current.focus();
  };

  const verifyCurrentAttempt = async (inputToVerify?: string) => {
    const text = inputToVerify || currentInput;
    if (!enrolledProfile) {
      alert(`User @${activeUsername} has not enrolled a TypingDNA biometric profile yet. Please complete the first-time biometric recording.`);
      return;
    }
    if (text.length === 0) return;

    setIsVerifying(true);
    const recorded = typingDna.getCurrentKeystrokes();

    try {
      const res = await typingDna.verifyAttempt(
        text,
        recorded,
        enrolledProfile,
        threshold,
        activeTarget
      );
      setVerificationResult(res);

      if (res.passed) {
        soundFX.playSuccess();
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#10b981', '#3b82f6', '#ec4899'],
        });
      } else {
        soundFX.playFailure();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  // Imposter simulation: Types the exact characters with alien/imposter cadence (high variance)
  const simulateImposterAttack = () => {
    resetAttempt();
    const chars = activeTarget.split('');
    let idx = 0;

    const typeNext = () => {
      if (idx >= chars.length) return;
      const char = chars[idx];
      const code = char.charCodeAt(0);

      // Deliberately erratic imposter timing: either super-fast robotic 25ms or unnatural 380ms hesitation
      const dwell = idx % 2 === 0 ? 28 : 280;
      const flight = idx === 0 ? 0 : (idx % 3 === 0 ? 480 : 35);

      soundFX.playKeypress(250);
      typingDna.recordVirtualKeystroke(char, code, dwell, flight);
      setCurrentInput((prev) => prev + char);
      setCurrentKeystrokes([...typingDna.getCurrentKeystrokes()]);

      idx++;
      if (idx < chars.length) {
        setTimeout(typeNext, flight);
      } else {
        setTimeout(() => {
          verifyCurrentAttempt(activeTarget);
        }, 300);
      }
    };

    setTimeout(typeNext, 200);
  };

  // Authentic self simulation: Uses enrolled profile cadence to simulate authentic user typing
  const simulateOwnerTyping = () => {
    if (!enrolledProfile) return;
    resetAttempt();
    const chars = activeTarget.split('');
    let idx = 0;

    const typeNext = () => {
      if (idx >= chars.length) return;
      const char = chars[idx];
      const code = char.charCodeAt(0);

      const baseDwell = enrolledProfile.averagePressTime || 90;
      const baseFlight = enrolledProfile.averageSeekTime || 130;

      // Natural ±8ms variance
      const variance = (Math.random() - 0.5) * 16;
      const dwell = Math.max(30, Math.round(baseDwell + variance));
      const flight = Math.max(15, Math.round(baseFlight + variance));

      soundFX.playKeypress(500 + code * 2);
      typingDna.recordVirtualKeystroke(char, code, dwell, flight);
      setCurrentInput((prev) => prev + char);
      setCurrentKeystrokes([...typingDna.getCurrentKeystrokes()]);

      idx++;
      if (idx < chars.length) {
        setTimeout(typeNext, flight);
      } else {
        setTimeout(() => {
          verifyCurrentAttempt(activeTarget);
        }, 300);
      }
    };

    setTimeout(typeNext, 200);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Multi-User Identity Bar */}
      <UserSelector
        activeUsername={activeUsername}
        onSelectUser={onSelectUser}
        onStartFirstTimeRecording={(uname) => onNavigateToEnroll(uname)}
      />

      {/* Top Banner & Security Config */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-sm shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-slate-100">
                Passwordless Biometric Verification
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Authenticate purely by typing the challenge message. TypingDNA compares your biological keystroke dynamics against the registered profile for <strong className="text-cyan-300 font-mono">@{activeUsername}</strong>.
            </p>
          </div>

          {/* Security Threshold Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Threshold:</span>
            </span>
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
              {(['relaxed', 'normal', 'strict'] as SecurityThreshold[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  id={`threshold-${t}-btn`}
                  onClick={() => setThreshold(t)}
                  className={`px-2 py-1 rounded-lg capitalize font-semibold transition-all ${
                    threshold === t
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t} ({t === 'relaxed' ? '58%' : t === 'strict' ? '78%' : '68%'})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* First-Time Recording Callout or Active Profile Status */}
        {isFirstTime ? (
          <div className="mt-4 p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-amber-200 font-mono">
                  First-Time Biometric Recording Required for @{activeUsername}
                </div>
                <div className="text-xs text-amber-300/80 mt-0.5">
                  This username has no registered typing baseline yet. Record biometrics to activate passwordless login.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="first-time-record-cta-btn"
                onClick={() => onNavigateToEnroll(activeUsername)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold font-mono text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Record Biometrics (First Time)</span>
              </button>

              <button
                type="button"
                id="preload-demo-btn"
                onClick={() => onPreloadDemoProfile(activeUsername)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                title="Load pre-calibrated sample biometrics for quick test"
              >
                Quick Demo
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-mono">
                Enrolled Profile Active for <strong className="text-cyan-300">@{activeUsername}</strong>
                <span className="text-slate-500 ml-2">
                  (Dwell: {enrolledProfile.averagePressTime}ms, Flight: {enrolledProfile.averageSeekTime}ms)
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="goto-re-enroll-btn"
                onClick={() => onNavigateToEnroll(activeUsername)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Re-record Biometrics</span>
              </button>
            </div>
          </div>
        )}

        {/* Challenge Mode Switcher */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <span>Challenge Type:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                id="challenge-random-btn"
                onClick={() => {
                  setMode('random_message');
                  handleShuffleChallenge();
                }}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                  mode === 'random_message'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Random Message</span>
              </button>

              <button
                type="button"
                id="challenge-pin4-btn"
                onClick={() => {
                  setMode('pin4');
                  resetAttempt();
                }}
                className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                  mode === 'pin4'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                4-Digit PIN
              </button>

              <button
                type="button"
                id="challenge-pin6-btn"
                onClick={() => {
                  setMode('pin6');
                  resetAttempt();
                }}
                className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                  mode === 'pin6'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                6-Digit PIN
              </button>
            </div>
          </div>

          {mode === 'random_message' && (
            <button
              type="button"
              id="shuffle-top-btn"
              onClick={handleShuffleChallenge}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Change Message</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Random Challenge Message Display */}
      {mode === 'random_message' && (
        <ChallengeMessageDisplay
          targetMessage={targetMessage}
          typedText={currentInput}
          onShuffleMessage={handleShuffleChallenge}
        />
      )}

      {/* Main Verification Input Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Passcode Entry Side */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 truncate max-w-[200px]">
              Type Target Message
            </span>

            {/* Imposter Attack Simulation Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                id="sim-owner-btn"
                title="Simulate authentic owner typing rhythm"
                onClick={simulateOwnerTyping}
                disabled={!enrolledProfile}
                className="text-[10px] font-mono bg-slate-950 hover:bg-slate-850 border border-emerald-800/80 text-emerald-400 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-40"
              >
                <UserCheck className="w-3 h-3" />
                <span>Simulate Owner</span>
              </button>

              <button
                type="button"
                id="sim-imposter-btn"
                title="Test imposter typing with abnormal cadence"
                onClick={simulateImposterAttack}
                disabled={!enrolledProfile}
                className="text-[10px] font-mono bg-slate-950 hover:bg-slate-850 border border-rose-800/80 text-rose-400 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-40"
              >
                <UserX className="w-3 h-3" />
                <span>Test Imposter</span>
              </button>
            </div>
          </div>

          <PasscodeDisplay
            passcode={currentInput}
            expectedLength={expectedLength}
            mode={mode}
            showPasscode={showPasscode}
            setShowPasscode={setShowPasscode}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onClear={resetAttempt}
            keystrokes={currentKeystrokes}
            inputRef={inputRef}
            label={mode === 'random_message' ? 'Challenge Typing Buffer' : 'Passcode Entry'}
            isVerifying={isVerifying}
          />

          <div className="w-full my-4 border-t border-slate-800/80" />

          {/* Virtual Keypad */}
          <VirtualKeypad
            onKeyPress={(char, code) => handleCharacterInput(char, code)}
            onBackspace={handleBackspace}
            onSubmit={() => verifyCurrentAttempt()}
            canSubmit={currentInput.length === expectedLength}
            isTextMode={mode === 'random_message' || mode === 'custom'}
          />
        </div>

        {/* Live Keystroke Dynamics Display */}
        <div className="lg:col-span-6 space-y-4">
          <TypingDnaVisualizer
            currentKeystrokes={currentKeystrokes}
            enrolledProfile={enrolledProfile}
            passcode={activeTarget}
            isVerifying={true}
            quality={typingDna.getQuality(typingDna.getRawTypingPattern(currentInput || activeTarget))}
          />

          <RawPatternInspector
            rawPattern={typingDna.getRawTypingPattern(currentInput || activeTarget)}
            passcode={currentInput || activeTarget}
            source="TypingDNA Live Buffer"
          />
        </div>
      </div>

      {/* Verification Result Modal */}
      {verificationResult && enrolledProfile && (
        <VerificationResultModal
          result={verificationResult}
          enrolledProfile={enrolledProfile}
          onRetry={() => {
            setVerificationResult(null);
            resetAttempt();
            // Automatically change message each time for next attempt
            if (mode === 'random_message') {
              handleShuffleChallenge();
            }
          }}
          onClose={() => {
            setVerificationResult(null);
            if (mode === 'random_message') {
              handleShuffleChallenge();
            }
          }}
        />
      )}
    </div>
  );
}
