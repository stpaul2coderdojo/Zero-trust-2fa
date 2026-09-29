import { KeystrokeMetric, TypingDnaProfile, VerificationResult, SecurityThreshold, UserRecord } from '../types';

declare global {
  interface Window {
    TypingDNA?: any;
    tdnaInstance?: any;
  }
}

const STORAGE_KEY = 'typingdna_enrolled_profile_v2';
const USERS_STORAGE_KEY = 'typingdna_users_v3';
const ACTIVE_USER_KEY = 'typingdna_active_user_v3';

export class TypingDnaService {
  private tdna: any = null;
  private currentKeystrokes: KeystrokeMetric[] = [];
  private activeKeydownTimes: Map<string, number> = new Map();
  private lastKeyUpTime: number = 0;

  constructor() {
    this.initTdna();
  }


  public initTdna(): any {
    if (typeof window === 'undefined') return null;
    if (this.tdna) return this.tdna;

    if (window.TypingDNA) {
      if (!window.tdnaInstance) {
        window.tdnaInstance = new window.TypingDNA();
      }
      this.tdna = window.tdnaInstance;
      return this.tdna;
    }
    return null;
  }

  public registerTarget(elementId: string): void {
    const tdna = this.initTdna();
    if (tdna && tdna.addTarget) {
      try {
        tdna.addTarget(elementId);
      } catch (e) {
        console.warn('Target add error', e);
      }
    }
  }

  public resetRecorder(): void {
    this.currentKeystrokes = [];
    this.activeKeydownTimes.clear();
    this.lastKeyUpTime = 0;
    const tdna = this.initTdna();
    if (tdna && tdna.reset) {
      try {
        tdna.reset();
      } catch (e) {
        console.warn('Reset error', e);
      }
    }
  }

  public handleKeyDown(key: string, keyCode: number): void {
    const now = performance.now();
    const keyId = `${key}_${keyCode}`;
    if (!this.activeKeydownTimes.has(keyId)) {
      this.activeKeydownTimes.set(keyId, now);
    }
  }

  public handleKeyUp(key: string, keyCode: number): KeystrokeMetric | null {
    const now = performance.now();
    const keyId = `${key}_${keyCode}`;
    const downTime = this.activeKeydownTimes.get(keyId) || (now - 80);
    this.activeKeydownTimes.delete(keyId);

    const pressTime = Math.max(15, Math.round(now - downTime));
    const seekTime = this.lastKeyUpTime > 0 ? Math.max(10, Math.min(1500, Math.round(downTime - this.lastKeyUpTime))) : 0;
    this.lastKeyUpTime = now;

    const metric: KeystrokeMetric = {
      key,
      keyCode,
      pressTime,
      seekTime,
      downTimestamp: Math.round(downTime),
      upTimestamp: Math.round(now),
    };

    this.currentKeystrokes.push(metric);
    return metric;
  }

  public recordVirtualKeystroke(key: string, keyCode: number, simulatedDwell = 95, simulatedFlight = 140): KeystrokeMetric {
    const now = performance.now();
    const metric: KeystrokeMetric = {
      key,
      keyCode,
      pressTime: simulatedDwell,
      seekTime: this.currentKeystrokes.length === 0 ? 0 : simulatedFlight,
      downTimestamp: Math.round(now - simulatedDwell),
      upTimestamp: Math.round(now),
    };
    this.currentKeystrokes.push(metric);
    this.lastKeyUpTime = now;
    return metric;
  }

  public removeLastKeystroke(): void {
    if (this.currentKeystrokes.length > 0) {
      this.currentKeystrokes.pop();
    }
  }

  public getCurrentKeystrokes(): KeystrokeMetric[] {
    return [...this.currentKeystrokes];
  }

  public getRawTypingPattern(passcode: string, targetId = 'passcode-input'): string {
    const tdna = this.initTdna();
    if (tdna && tdna.getTypingPattern) {
      try {
        const pattern = tdna.getTypingPattern({
          type: 1,
          text: passcode,
          targetId: targetId,
        });
        if (pattern && typeof pattern === 'string' && pattern.length > 10) {
          return pattern;
        }
      } catch (err) {
        console.warn('TypingDNA getTypingPattern error, using biometric serializer', err);
      }
    }

    // High fidelity TypingDNA pattern format serialization:
    // Format: 0,version,isMobile,hasMotion,length,textId,quality,...|keyData
    const textId = this.fnv1aHash(passcode);
    const keyData = this.currentKeystrokes
      .map((k) => `${k.keyCode},${k.seekTime},${k.pressTime}`)
      .join(',');
    
    return `0,3.2,0,0,${this.currentKeystrokes.length},${textId},1,0,0,0,1,1,1,1920,1080,1,0,${this.fnv1aHash(keyData)}|${keyData}`;
  }

  public getQuality(pattern: string): number {
    if (typeof window !== 'undefined' && window.TypingDNA && window.TypingDNA.getQuality) {
      try {
        const q = window.TypingDNA.getQuality(pattern);
        if (typeof q === 'number' && !isNaN(q) && q > 0) {
          return Math.min(1, Math.max(0, q));
        }
      } catch {
        // fallback below
      }
    }

    // Heuristic biometric quality check based on keystroke count and variance
    if (!this.currentKeystrokes || this.currentKeystrokes.length < 3) return 0.45;
    const presses = this.currentKeystrokes.map(k => k.pressTime);
    const mean = presses.reduce((a, b) => a + b, 0) / presses.length;
    const variance = presses.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / presses.length;
    const stdDev = Math.sqrt(variance);

    // Human typing typically has dwell times between 40ms and 180ms with natural variation
    const isHumanLike = mean > 30 && mean < 250 && stdDev > 5;
    return isHumanLike ? 0.85 : 0.6;
  }

  public createProfile(username: string, passcode: string, samples: KeystrokeMetric[][]): TypingDnaProfile {
    // Merge or average multiple enrollment samples
    const baseSample = samples[samples.length - 1] || this.currentKeystrokes;
    const keyCount = baseSample.length;

    const averagedKeystrokes: KeystrokeMetric[] = [];
    for (let i = 0; i < keyCount; i++) {
      let sumPress = 0;
      let sumSeek = 0;
      let validSamples = 0;

      samples.forEach(sample => {
        if (sample[i]) {
          sumPress += sample[i].pressTime;
          sumSeek += sample[i].seekTime;
          validSamples++;
        }
      });

      const avgPress = validSamples > 0 ? Math.round(sumPress / validSamples) : baseSample[i]?.pressTime || 90;
      const avgSeek = validSamples > 0 ? Math.round(sumSeek / validSamples) : baseSample[i]?.seekTime || 120;

      averagedKeystrokes.push({
        key: baseSample[i]?.key || '•',
        keyCode: baseSample[i]?.keyCode || 0,
        pressTime: avgPress,
        seekTime: avgSeek,
        downTimestamp: 0,
        upTimestamp: 0,
      });
    }

    const totalPress = averagedKeystrokes.reduce((acc, k) => acc + k.pressTime, 0);
    const totalSeek = averagedKeystrokes.reduce((acc, k) => acc + k.seekTime, 0);
    const rawPattern = this.getRawTypingPattern(passcode);
    const quality = this.getQuality(rawPattern);

    const profile: TypingDnaProfile = {
      id: 'profile_' + Date.now(),
      username,
      passcode,
      createdAt: Date.now(),
      patternType: 1,
      rawPattern,
      quality,
      averagePressTime: Math.round(totalPress / (averagedKeystrokes.length || 1)),
      averageSeekTime: Math.round(totalSeek / (averagedKeystrokes.length || 1)),
      totalDuration: totalPress + totalSeek,
      keystrokes: averagedKeystrokes,
      dnaHash: this.generateDnaFingerprint(averagedKeystrokes),
      samplesCount: samples.length,
    };

    // Calculate baseline cadence metrics for cross-text Anytext comparison
    const dwellValues = averagedKeystrokes.map((k) => k.pressTime);
    const flightValues = averagedKeystrokes.map((k) => k.seekTime);
    const avgDwell = profile.averagePressTime;
    const avgFlight = profile.averageSeekTime;
    const stdDwell = Math.sqrt(
      dwellValues.reduce((a, b) => a + Math.pow(b - avgDwell, 2), 0) / (dwellValues.length || 1)
    );
    const stdFlight = Math.sqrt(
      flightValues.reduce((a, b) => a + Math.pow(b - avgFlight, 2), 0) / (flightValues.length || 1)
    );
    const totalSecs = (totalPress + totalSeek) / 1000;
    const wpm = totalSecs > 0 ? Math.round((averagedKeystrokes.length / 5) / (totalSecs / 60)) : 45;

    const userRecord: UserRecord = {
      username,
      hasEnrolled: true,
      enrolledAt: Date.now(),
      profile,
      sampleCount: samples.length,
      baselineCadence: {
        avgDwell,
        avgFlight,
        stdDwell,
        stdFlight,
        wpm,
      },
    };
    this.saveUser(userRecord);

    return profile;
  }

  // --- Multi-User Management ---
  public getAllUsers(): Record<string, UserRecord> {
    if (typeof window === 'undefined') return {};
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return {};
    try {
      return JSON.parse(raw) as Record<string, UserRecord>;
    } catch {
      return {};
    }
  }

  public getUser(username: string): UserRecord | null {
    const users = this.getAllUsers();
    return users[username.trim().toLowerCase()] || null;
  }

  public saveUser(user: UserRecord): void {
    if (typeof window === 'undefined') return;
    const users = this.getAllUsers();
    const key = user.username.trim().toLowerCase();
    users[key] = user;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  public deleteUser(username: string): void {
    if (typeof window === 'undefined') return;
    const users = this.getAllUsers();
    const key = username.trim().toLowerCase();
    delete users[key];
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  public getActiveUsername(): string {
    if (typeof window === 'undefined') return 'alice';
    const active = localStorage.getItem(ACTIVE_USER_KEY);
    return active || 'alice';
  }

  public setActiveUsername(username: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACTIVE_USER_KEY, username.trim().toLowerCase());
  }

  public isFirstTimeUser(username: string): boolean {
    const user = this.getUser(username);
    return !user || !user.hasEnrolled || !user.profile;
  }

  public saveEnrolledProfile(profile: TypingDnaProfile, username?: string): void {
    const uname = (username || profile.username || this.getActiveUsername()).trim().toLowerCase();
    profile.username = uname;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }
    const user = this.getUser(uname) || {
      username: uname,
      hasEnrolled: true,
      enrolledAt: Date.now(),
      sampleCount: profile.samplesCount || 1,
    };
    user.hasEnrolled = true;
    user.enrolledAt = Date.now();
    user.profile = profile;
    this.saveUser(user);
  }

  public getEnrolledProfile(username?: string): TypingDnaProfile | null {
    if (typeof window === 'undefined') return null;
    if (username) {
      const user = this.getUser(username);
      if (user?.profile) return user.profile;
    }
    const activeUname = this.getActiveUsername();
    const user = this.getUser(activeUname);
    if (user?.profile) return user.profile;

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as TypingDnaProfile;
    } catch {
      return null;
    }
  }

  public clearEnrolledProfile(username?: string): void {
    if (typeof window === 'undefined') return;
    const uname = (username || this.getActiveUsername()).trim().toLowerCase();
    const users = this.getAllUsers();
    if (users[uname]) {
      users[uname].hasEnrolled = false;
      delete users[uname].profile;
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
    localStorage.removeItem(STORAGE_KEY);
  }

  public async verifyAttempt(
    passcodeTyped: string,
    attemptKeystrokes: KeystrokeMetric[],
    enrolledProfile: TypingDnaProfile,
    threshold: SecurityThreshold = 'normal',
    expectedText?: string
  ): Promise<VerificationResult> {
    const targetExpected = expectedText || enrolledProfile.passcode;
    const rawAttemptPattern = this.getRawTypingPattern(passcodeTyped);
    const quality = this.getQuality(rawAttemptPattern);
    const targetPasscodeMatched = passcodeTyped === targetExpected;

    if (!targetPasscodeMatched || attemptKeystrokes.length === 0) {
      return {
        matchScore: 0,
        passed: false,
        confidence: 'REJECTED',
        quality,
        pressTimeVariance: 100,
        seekTimeVariance: 100,
        targetPasscodeMatched,
        rawPattern: rawAttemptPattern,
        attemptKeystrokes,
        source: 'local_engine',
        details: { dwellSimilarity: 0, flightSimilarity: 0, rhythmCorrelation: 0 },
      };
    }

    // Check if Cloud API proxy is available and online
    let cloudResult: any = null;
    try {
      const resp = await fetch('/api/typingdna/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tp1: enrolledProfile.rawPattern,
          tp2: rawAttemptPattern,
          quality: 2,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.source === 'cloud_api' && typeof data.net_score === 'number') {
          cloudResult = data;
        }
      }
    } catch {
      // Cloud API not available, use local matching
    }

    const isSameText = targetExpected === enrolledProfile.passcode;
    const enrolledKeys = enrolledProfile.keystrokes;

    let dwellSim = 0;
    let flightSim = 0;
    let rhythmScore = 0;
    let dwellVariancePerc = 0;
    let flightVariancePerc = 0;
    let finalScore = 0;

    if (isSameText) {
      // Direct vector comparison for identical passcode / PIN
      const minKeys = Math.min(enrolledKeys.length, attemptKeystrokes.length);
      const dwellEnrolled = enrolledKeys.slice(0, minKeys).map((k) => k.pressTime);
      const dwellAttempt = attemptKeystrokes.slice(0, minKeys).map((k) => k.pressTime);
      const flightEnrolled = enrolledKeys.slice(0, minKeys).map((k) => k.seekTime);
      const flightAttempt = attemptKeystrokes.slice(0, minKeys).map((k) => k.seekTime);

      dwellSim = this.cosineSimilarity(dwellEnrolled, dwellAttempt);

      let dwellDevSum = 0;
      for (let i = 0; i < minKeys; i++) {
        const diff = Math.abs(dwellEnrolled[i] - dwellAttempt[i]);
        const maxVal = Math.max(dwellEnrolled[i], dwellAttempt[i], 1);
        dwellDevSum += diff / maxVal;
      }
      dwellVariancePerc = Math.round((dwellDevSum / minKeys) * 100);

      flightSim = this.cosineSimilarity(flightEnrolled, flightAttempt);
      let flightDevSum = 0;
      for (let i = 0; i < minKeys; i++) {
        const diff = Math.abs(flightEnrolled[i] - flightAttempt[i]);
        const maxVal = Math.max(flightEnrolled[i], flightAttempt[i], 1);
        flightDevSum += diff / maxVal;
      }
      flightVariancePerc = Math.round((flightDevSum / minKeys) * 100);

      const rCorr = this.pearsonCorrelation(dwellEnrolled, dwellAttempt);
      rhythmScore = Math.max(0, Math.min(100, ((rCorr + 1) / 2) * 100));

      const dwellScore = Math.max(0, Math.min(100, dwellSim * 100 * (1 - dwellVariancePerc / 200)));
      const flightScore = Math.max(0, Math.min(100, flightSim * 100 * (1 - flightVariancePerc / 200)));
      finalScore = Math.round(0.45 * dwellScore + 0.35 * flightScore + 0.20 * rhythmScore);
    } else {
      // Dynamic random challenge message: Cross-text Anytext Biometric Comparison
      const attemptDwells = attemptKeystrokes.map((k) => k.pressTime);
      const attemptFlights = attemptKeystrokes.map((k) => k.seekTime);
      const attemptAvgDwell = attemptDwells.reduce((a, b) => a + b, 0) / (attemptDwells.length || 1);
      const attemptAvgFlight = attemptFlights.reduce((a, b) => a + b, 0) / (attemptFlights.length || 1);

      const enrolledAvgDwell = enrolledProfile.averagePressTime || 90;
      const enrolledAvgFlight = enrolledProfile.averageSeekTime || 130;

      // Dwell ratio comparison (human dwell range consistency)
      const dwellRatio = Math.min(attemptAvgDwell, enrolledAvgDwell) / Math.max(attemptAvgDwell, enrolledAvgDwell, 1);
      dwellSim = Math.max(0, Math.min(1, dwellRatio));
      dwellVariancePerc = Math.round((1 - dwellSim) * 100);

      // Flight ratio comparison
      const flightRatio = Math.min(attemptAvgFlight, enrolledAvgFlight) / Math.max(attemptAvgFlight, enrolledAvgFlight, 1);
      flightSim = Math.max(0, Math.min(1, flightRatio));
      flightVariancePerc = Math.round((1 - flightSim) * 100);

      // Common character dwell comparison
      const enrolledKeyMap = new Map<string, number>();
      enrolledKeys.forEach((k) => enrolledKeyMap.set(k.key.toLowerCase(), k.pressTime));

      let matchedChars = 0;
      let matchedCharScoreSum = 0;
      attemptKeystrokes.forEach((k) => {
        const basePress = enrolledKeyMap.get(k.key.toLowerCase());
        if (basePress) {
          matchedChars++;
          const sim = Math.min(k.pressTime, basePress) / Math.max(k.pressTime, basePress, 1);
          matchedCharScoreSum += sim;
        }
      });

      const charScore = matchedChars > 0 ? matchedCharScoreSum / matchedChars : dwellSim;
      rhythmScore = Math.round(charScore * 100);

      const dwellScore = Math.max(0, Math.min(100, dwellSim * 100));
      const flightScore = Math.max(0, Math.min(100, flightSim * 100));
      finalScore = Math.round(0.40 * dwellScore + 0.30 * flightScore + 0.30 * rhythmScore);
    }

    // If Cloud API responded, blend or use cloud net_score
    let source: 'local_engine' | 'cloud_api' = 'local_engine';
    if (cloudResult && typeof cloudResult.net_score === 'number') {
      finalScore = Math.round(cloudResult.net_score);
      source = 'cloud_api';
    }

    // Threshold evaluation
    const thresholdCutoff = threshold === 'relaxed' ? 58 : threshold === 'strict' ? 78 : 68;
    const passed = targetPasscodeMatched && finalScore >= thresholdCutoff;

    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'REJECTED' = 'REJECTED';
    if (finalScore >= 85) confidence = 'HIGH';
    else if (finalScore >= 70) confidence = 'MEDIUM';
    else if (finalScore >= thresholdCutoff) confidence = 'LOW';

    return {
      matchScore: finalScore,
      passed,
      confidence,
      quality,
      pressTimeVariance: dwellVariancePerc,
      seekTimeVariance: flightVariancePerc,
      targetPasscodeMatched,
      rawPattern: rawAttemptPattern,
      attemptKeystrokes,
      source,
      details: {
        dwellSimilarity: Math.round(dwellSim * 100),
        flightSimilarity: Math.round(flightSim * 100),
        rhythmCorrelation: Math.round(rhythmScore),
      },
    };
  }


  // Math helper for Cosine similarity between two vectors
  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Pearson correlation coefficient
  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n < 2) return 1;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumX2 += x[i] * x[i];
      sumY2 += y[i] * y[i];
    }
    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    if (den === 0) return 1;
    return Math.max(-1, Math.min(1, num / den));
  }

  // Deterministic FNV-1a Hash used by TypingDNA
  public fnv1aHash(str: string): number {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  // Generates visual DNA sequence representation (e.g. A-T-C-G base codes and rhythmic bar ratios)
  public generateDnaFingerprint(keystrokes: KeystrokeMetric[]): string {
    const bases = ['A', 'C', 'G', 'T'];
    return keystrokes
      .map((k) => {
        const index = (Math.round(k.pressTime) + Math.round(k.seekTime)) % 4;
        return bases[index];
      })
      .join('-');
  }
}

export const typingDna = new TypingDnaService();
