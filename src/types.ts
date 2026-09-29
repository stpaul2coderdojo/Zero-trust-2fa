export interface KeystrokeMetric {
  key: string;
  keyCode: number;
  pressTime: number; // Duration key held down (ms)
  seekTime: number;  // Interval from previous key release/press (ms)
  downTimestamp: number;
  upTimestamp: number;
}

export interface UserRecord {
  username: string;
  hasEnrolled: boolean;
  enrolledAt?: number;
  profile?: TypingDnaProfile;
  sampleCount: number;
  baselineCadence?: {
    avgDwell: number;
    avgFlight: number;
    stdDwell: number;
    stdFlight: number;
    wpm: number;
  };
}

export interface TypingDnaProfile {
  id: string;
  username: string;
  passcode: string; // Target message / passcode
  createdAt: number;
  patternType: number;
  rawPattern: string;
  quality: number;
  averagePressTime: number;
  averageSeekTime: number;
  totalDuration: number;
  keystrokes: KeystrokeMetric[];
  dnaHash: string;
  samplesCount: number;
}

export interface VerificationResult {
  matchScore: number;       // 0 to 100
  passed: boolean;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'REJECTED';
  quality: number;
  pressTimeVariance: number; // percentage
  seekTimeVariance: number;  // percentage
  targetPasscodeMatched: boolean;
  rawPattern: string;
  attemptKeystrokes: KeystrokeMetric[];
  source: 'local_engine' | 'cloud_api';
  details: {
    dwellSimilarity: number;
    flightSimilarity: number;
    rhythmCorrelation: number;
  };
}

export type PasscodeMode = 'pin4' | 'pin6' | 'random_message' | 'custom';
export type AppTab = 'verify' | 'enroll' | 'analytics' | 'github';
export type SecurityThreshold = 'relaxed' | 'normal' | 'strict';

