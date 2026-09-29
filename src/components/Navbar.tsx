import { useState, useEffect } from 'react';
import { ShieldCheck, Dna, Volume2, VolumeX, Github, Lock, CheckCircle2 } from 'lucide-react';
import { soundFX } from '../lib/audioFeedback';

interface NavbarProps {
  activeTab: 'verify' | 'enroll' | 'analytics' | 'github';
  setActiveTab: (tab: 'verify' | 'enroll' | 'analytics' | 'github') => void;
  hasEnrolledProfile: boolean;
  onReset: () => void;
}

export function Navbar({ activeTab, setActiveTab, hasEnrolledProfile, onReset }: NavbarProps) {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [hasCloudApi, setHasCloudApi] = useState(false);

  useEffect(() => {
    fetch('/api/typingdna/status')
      .then(res => res.json())
      .then(data => {
        if (data.hasCloudApi) setHasCloudApi(true);
      })
      .catch(() => {});
  }, []);

  const toggleAudio = () => {
    const next = !audioEnabled;
    soundFX.enabled = next;
    setAudioEnabled(next);
    if (next) soundFX.playKeypress(800);
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Dna className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 tracking-tight text-lg">TypingDNA</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-medium">
                Passwordless
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Keystroke Biometric Authentication & DNA Visualizer
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            id="tab-verify-btn"
            onClick={() => {
              soundFX.playKeypress(650);
              setActiveTab('verify');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'verify'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Verify</span>
          </button>

          <button
            id="tab-enroll-btn"
            onClick={() => {
              soundFX.playKeypress(650);
              setActiveTab('enroll');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'enroll'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Enroll Profile</span>
            {hasEnrolledProfile && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            )}
          </button>

          <button
            id="tab-analytics-btn"
            onClick={() => {
              soundFX.playKeypress(650);
              setActiveTab('analytics');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dna className="w-3.5 h-3.5" />
            <span>DNA Display</span>
          </button>

          <button
            id="tab-github-btn"
            onClick={() => {
              soundFX.playKeypress(650);
              setActiveTab('github');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'github'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden md:inline">GitHub Code</span>
          </button>
        </nav>

        {/* Status Pill & Sound FX */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-mono">typingdna.js v3.2</span>
            {hasCloudApi ? (
              <span className="text-[10px] text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                Cloud API
              </span>
            ) : (
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                Client Engine
              </span>
            )}
          </div>

          <button
            id="audio-toggle-btn"
            onClick={toggleAudio}
            title={audioEnabled ? 'Mute audio cues' : 'Enable audio cues'}
            className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-100 transition-colors"
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>
    </header>
  );
}
