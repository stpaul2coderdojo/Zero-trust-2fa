import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { VerificationFlow } from './components/VerificationFlow';
import { EnrollmentFlow } from './components/EnrollmentFlow';
import { AnalyticsView } from './components/AnalyticsView';
import { GitHubRefCard } from './components/GitHubRefCard';
import { AppTab, TypingDnaProfile, UserRecord } from './types';
import { typingDna } from './lib/typingDnaEngine';
import { soundFX } from './lib/audioFeedback';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('verify');
  const [activeUsername, setActiveUsername] = useState<string>(() => typingDna.getActiveUsername());
  const [enrolledProfile, setEnrolledProfile] = useState<TypingDnaProfile | null>(null);

  useEffect(() => {
    // Check if any users exist in storage
    const users = typingDna.getAllUsers();
    if (Object.keys(users).length === 0) {
      // Seed default accounts:
      // 'alice' -> already has enrolled biometrics for instant testing
      // 'bob'   -> first-time user without biometrics to showcase the first-time recording option!
      preloadInitialAccounts();
    } else {
      const currentUname = typingDna.getActiveUsername();
      setActiveUsername(currentUname);
      setEnrolledProfile(typingDna.getEnrolledProfile(currentUname));
    }
  }, []);

  const preloadInitialAccounts = () => {
    // 1. Enrolled User 'alice'
    const aliceSamples = [
      [
        { key: '7', keyCode: 55, pressTime: 92, seekTime: 0, downTimestamp: 0, upTimestamp: 0 },
        { key: '2', keyCode: 50, pressTime: 85, seekTime: 140, downTimestamp: 0, upTimestamp: 0 },
        { key: '9', keyCode: 57, pressTime: 104, seekTime: 165, downTimestamp: 0, upTimestamp: 0 },
        { key: '4', keyCode: 52, pressTime: 88, seekTime: 115, downTimestamp: 0, upTimestamp: 0 },
      ],
      [
        { key: '7', keyCode: 55, pressTime: 89, seekTime: 0, downTimestamp: 0, upTimestamp: 0 },
        { key: '2', keyCode: 50, pressTime: 82, seekTime: 135, downTimestamp: 0, upTimestamp: 0 },
        { key: '9', keyCode: 57, pressTime: 108, seekTime: 160, downTimestamp: 0, upTimestamp: 0 },
        { key: '4', keyCode: 52, pressTime: 91, seekTime: 120, downTimestamp: 0, upTimestamp: 0 },
      ],
    ];

    const aliceProfile = typingDna.createProfile('alice', '7294', aliceSamples);
    typingDna.saveEnrolledProfile(aliceProfile, 'alice');

    // 2. First-Time User 'bob' (no biometrics yet!)
    const bobRecord: UserRecord = {
      username: 'bob',
      hasEnrolled: false,
      sampleCount: 0,
    };
    typingDna.saveUser(bobRecord);

    // Set alice as default active user
    typingDna.setActiveUsername('alice');
    setActiveUsername('alice');
    setEnrolledProfile(aliceProfile);
  };

  const handleSelectUser = (username: string) => {
    const uname = username.toLowerCase();
    setActiveUsername(uname);
    const profile = typingDna.getEnrolledProfile(uname);
    setEnrolledProfile(profile);
  };

  const handleNavigateToEnroll = (username?: string) => {
    if (username) {
      handleSelectUser(username);
    }
    setActiveTab('enroll');
  };

  const preloadDemoForUser = (username?: string) => {
    const targetUname = (username || activeUsername).toLowerCase();
    const demoSamples = [
      [
        { key: '7', keyCode: 55, pressTime: 95, seekTime: 0, downTimestamp: 0, upTimestamp: 0 },
        { key: '2', keyCode: 50, pressTime: 86, seekTime: 130, downTimestamp: 0, upTimestamp: 0 },
        { key: '9', keyCode: 57, pressTime: 102, seekTime: 155, downTimestamp: 0, upTimestamp: 0 },
        { key: '4', keyCode: 52, pressTime: 89, seekTime: 110, downTimestamp: 0, upTimestamp: 0 },
      ],
      [
        { key: '7', keyCode: 55, pressTime: 91, seekTime: 0, downTimestamp: 0, upTimestamp: 0 },
        { key: '2', keyCode: 50, pressTime: 84, seekTime: 132, downTimestamp: 0, upTimestamp: 0 },
        { key: '9', keyCode: 57, pressTime: 105, seekTime: 158, downTimestamp: 0, upTimestamp: 0 },
        { key: '4', keyCode: 52, pressTime: 90, seekTime: 118, downTimestamp: 0, upTimestamp: 0 },
      ],
    ];

    const profile = typingDna.createProfile(targetUname, '7294', demoSamples);
    typingDna.saveEnrolledProfile(profile, targetUname);
    setEnrolledProfile(profile);
    soundFX.playSuccess();
  };

  const handleEnrollmentComplete = (profile: TypingDnaProfile) => {
    setEnrolledProfile(profile);
    setActiveTab('verify');
  };

  const handleClearProfile = () => {
    typingDna.clearEnrolledProfile(activeUsername);
    setEnrolledProfile(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasEnrolledProfile={Boolean(enrolledProfile)}
        onReset={() => {
          handleClearProfile();
          setActiveTab('enroll');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'verify' && (
          <VerificationFlow
            activeUsername={activeUsername}
            onSelectUser={handleSelectUser}
            enrolledProfile={enrolledProfile}
            onNavigateToEnroll={handleNavigateToEnroll}
            onPreloadDemoProfile={preloadDemoForUser}
          />
        )}

        {activeTab === 'enroll' && (
          <EnrollmentFlow
            activeUsername={activeUsername}
            onEnrollmentComplete={handleEnrollmentComplete}
            currentProfile={enrolledProfile}
            onClearProfile={handleClearProfile}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            enrolledProfile={enrolledProfile}
            onNavigateToEnroll={() => setActiveTab('enroll')}
          />
        )}

        {activeTab === 'github' && <GitHubRefCard />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            TypingDNA Biometrics • Passwordless Verification with Dynamic Challenge Messages
          </span>
          <span className="text-slate-600">
            Multi-User Keystroke Dynamics Engine • TypingDnaRecorder-JavaScript
          </span>
        </div>
      </footer>
    </div>
  );
}
