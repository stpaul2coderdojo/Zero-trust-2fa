import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ShieldCheck, CheckCircle2, RefreshCw, Sparkles, ArrowRight, Dna, Info, Shuffle, Fingerprint } from 'lucide-react';
import { PasscodeDisplay } from './PasscodeDisplay';
import { VirtualKeypad } from './VirtualKeypad';
import { ChallengeMessageDisplay } from './ChallengeMessageDisplay';
import { TypingDnaVisualizer } from './TypingDnaVisualizer';
import { RawPatternInspector } from './RawPatternInspector';
import { KeystrokeMetric, PasscodeMode, TypingDnaProfile } from '../types';
import { typingDna } from '../lib/typingDnaEngine';
import { soundFX } from '../lib/audioFeedback';
import { getRandomChallengeMessage } from '../lib/randomMessages';

interface EnrollmentFlowProps {
  activeUsername: string;
  onEnrollmentComplete: (profile: TypingDnaProfile) => void;
  currentProfile: TypingDnaProfile | null;
  onClearProfile: () => void;
}

export function EnrollmentFlow({
  activeUsername,
  onEnrollmentComplete,
  currentProfile,
  onClearProfile,
}: EnrollmentFlowProps) {
  const isFirstTimeUser = typingDna.isFirstTimeUser(activeUsername);

  const [mode, setMode] = useState<PasscodeMode>('random_message');
  const [targetPasscode, setTargetPasscode] = useState(() => getRandomChallengeMessage());
  const [currentInput, setCurrentInput] = useState('');
  const [showPasscode, setShowPasscode] = useState(true);
  const [samples, setSamples] = useState<KeystrokeMetric[][]>([]);
  const [currentKeystrokes, setCurrentKeystrokes] = useState<KeystrokeMetric[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 2; // 2 calibration samples provide high stability without tiring the user

  const inputRef = useRef<HTMLInputElement>(null);

  const expectedLength = mode === 'pin4' ? 4 : mode === 'pin6' ? 6 : targetPasscode.length;

  useEffect(() => {
    typingDna.registerTarget('passcode-input');
  }, []);

  const handleModeChange = (newMode: PasscodeMode) => {
    setMode(newMode);
    if (newMode === 'random_message') {
      setTargetPasscode(getRandomChallengeMessage());
    } else if (newMode === 'pin4') {
      setTargetPasscode('7294');
    } else if (newMode === 'pin6') {
      setTargetPasscode('814920');
    } else {
      setTargetPasscode('quantum99');
    }
    resetEnrollment();
  };

  const handleShuffleChallenge = () => {
    const fresh = getRandomChallengeMessage(targetPasscode);
    setTargetPasscode(fresh);
    resetEnrollment();
  };

  const resetEnrollment = () => {
    setCurrentInput('');
    setCurrentKeystrokes([]);
    setSamples([]);
    setCurrentStep(1);
    typingDna.resetRecorder();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      submitSample();
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

    // Auto-advance if sample filled
    if (updated.length === expectedLength) {
      setTimeout(() => {
        submitSample(updated);
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

  const submitSample = (inputToVerify?: string) => {
    const val = inputToVerify || currentInput;
    if (val.length !== expectedLength) return;

    // Verify correct characters
    if (val !== targetPasscode) {
      soundFX.playFailure();
      alert(`Characters typed did not match the target text.`);
      setCurrentInput('');
      setCurrentKeystrokes([]);
      typingDna.resetRecorder();
      return;
    }

    const recorded = typingDna.getCurrentKeystrokes();
    const updatedSamples = [...samples, recorded];
    setSamples(updatedSamples);

    soundFX.playSuccess();

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setCurrentInput('');
      setCurrentKeystrokes([]);
      typingDna.resetRecorder();
      if (inputRef.current) inputRef.current.focus();
    } else {
      // Completed all calibration samples! Create enrolled profile for this active username
      const finalProfile = typingDna.createProfile(activeUsername, targetPasscode, updatedSamples);
      typingDna.saveEnrolledProfile(finalProfile, activeUsername);
      onEnrollmentComplete(finalProfile);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#10b981', '#6366f1', '#f59e0b'],
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Banner / Setup Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-sm shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Fingerprint className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Enroll Typing Biometrics for</span>
                <span className="text-cyan-300 font-mono">@{activeUsername}</span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isFirstTimeUser
                ? '⚡ First-time setup: Type the challenge text twice to record and calibrate your biological keystroke rhythm.'
                : 'Re-recording baseline biometrics to recalibrate your neuromuscular typing signature.'}
            </p>
          </div>

          {/* Mode Selector */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              id="mode-random-msg-btn"
              onClick={() => handleModeChange('random_message')}
              className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-all flex items-center gap-1 ${
                mode === 'random_message'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Random Message</span>
            </button>

            <button
              id="mode-pin4-btn"
              onClick={() => handleModeChange('pin4')}
              className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-all ${
                mode === 'pin4'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              4-Digit PIN
            </button>

            <button
              id="mode-pin6-btn"
              onClick={() => handleModeChange('pin6')}
              className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-all ${
                mode === 'pin6'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              6-Digit PIN
            </button>

            <button
              id="mode-custom-btn"
              onClick={() => handleModeChange('custom')}
              className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-all ${
                mode === 'custom'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {/* Challenge Target or Passcode Editor */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Target Text:</span>
            {mode === 'random_message' ? (
              <span className="font-mono text-cyan-300 text-sm font-semibold truncate">
                &quot;{targetPasscode}&quot;
              </span>
            ) : (
              <input
                id="target-passcode-edit"
                type="text"
                value={targetPasscode}
                onChange={(e) => {
                  setTargetPasscode(e.target.value);
                  resetEnrollment();
                }}
                className="bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-sm px-2.5 py-1 rounded-lg focus:outline-none focus:border-cyan-400 max-w-xs"
              />
            )}
          </div>

          {/* Step Progression Indicators */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all ${
                  idx + 1 < currentStep
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60'
                    : idx + 1 === currentStep
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 animate-pulse'
                    : 'bg-slate-900 text-slate-600 border border-slate-800'
                }`}
              >
                {idx + 1 < currentStep ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <span>#{idx + 1}</span>
                )}
                <span>Round {idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Challenge Message Visualizer (When in random message mode) */}
      {mode === 'random_message' && (
        <ChallengeMessageDisplay
          targetMessage={targetPasscode}
          typedText={currentInput}
          onShuffleMessage={handleShuffleChallenge}
        />
      )}

      {/* Main Passcode Input & Keypad Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Passcode Entry Side */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col items-center">
          <div className="w-full text-center mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Round {currentStep} of {totalSteps}: Type naturally to calibrate @{activeUsername}
            </span>
          </div>

          <PasscodeDisplay
            passcode={currentInput}
            expectedLength={expectedLength}
            mode={mode}
            showPasscode={showPasscode}
            setShowPasscode={setShowPasscode}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onClear={resetEnrollment}
            keystrokes={currentKeystrokes}
            inputRef={inputRef}
            label={`Calibration Round #${currentStep}`}
          />

          <div className="w-full my-4 border-t border-slate-800/80" />

          {/* Keypad */}
          <VirtualKeypad
            onKeyPress={(char, code) => handleCharacterInput(char, code)}
            onBackspace={handleBackspace}
            onSubmit={() => submitSample()}
            canSubmit={currentInput.length === expectedLength}
            isTextMode={mode === 'random_message' || mode === 'custom'}
          />
        </div>

        {/* Live Enrollment Sample Insights */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Dna className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Biometric Calibration Logs (@{activeUsername})
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {samples.length} / {totalSteps} logged
              </span>
            </div>

            {/* Current sample vs previous samples comparison table */}
            <div className="mt-3 space-y-2">
              {samples.map((s, sIdx) => (
                <div
                  key={sIdx}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-300">Round #{sIdx + 1}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <span>
                      Dwell: <strong className="text-cyan-300">{Math.round(s.reduce((a, k) => a + k.pressTime, 0) / (s.length || 1))}ms</strong>
                    </span>
                    <span>
                      Flight: <strong className="text-violet-300">{Math.round(s.reduce((a, k) => a + k.seekTime, 0) / (s.length || 1))}ms</strong>
                    </span>
                  </div>
                </div>
              ))}

              {currentKeystrokes.length > 0 && (
                <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-800/60 flex items-center justify-between text-xs font-mono animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    <span className="text-cyan-300">Active Round #{currentStep}</span>
                  </div>
                  <div className="flex items-center gap-3 text-cyan-300">
                    <span>{currentKeystrokes.length}/{expectedLength} keys</span>
                  </div>
                </div>
              )}
            </div>

            {currentProfile && (
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Profile registered for &quot;<span className="text-cyan-300 font-mono font-bold">@{activeUsername}</span>&quot;
                </div>
                <button
                  type="button"
                  id="reset-enrolled-profile-btn"
                  onClick={() => {
                    soundFX.playKeypress(350);
                    onClearProfile();
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-mono transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Clear Biometrics</span>
                </button>
              </div>
            )}
          </div>

          <RawPatternInspector
            rawPattern={typingDna.getRawTypingPattern(currentInput || targetPasscode)}
            passcode={currentInput || targetPasscode}
            source="TypingDnaRecorder-JavaScript"
          />
        </div>
      </div>

      {/* Visualizer below */}
      <TypingDnaVisualizer
        currentKeystrokes={currentKeystrokes}
        enrolledProfile={currentProfile}
        passcode={targetPasscode}
        quality={typingDna.getQuality(typingDna.getRawTypingPattern(currentInput || targetPasscode))}
      />
    </div>
  );
}
