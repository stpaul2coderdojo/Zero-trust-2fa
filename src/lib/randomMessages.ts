// Random challenge message bank for TypingDNA passwordless typing biometrics

export const CHALLENGE_MESSAGES = [
  'quantum cipher ninety nine',
  'the quick silver fox jumps',
  'secure passwordless authentication',
  'typing biometrics unlock the vault',
  'neuromuscular memory in keystrokes',
  'cosmic galaxy voyage deep space',
  'unique physiological rhythm',
  'cryptographic signature eighty eight',
  'falcon wings soaring high above',
  'zero knowledge biometric proof',
  'pulsing rhythm on every keypress',
  'subtle dwell timing identity',
  'stellar constellation nebula forty two',
  'digital fingerprint in motion',
  'speed and rhythm define the user',
  'matrix terminal connection established',
  'hyperdrive activated sequence seven',
  'seamless biometric security verification',
  'kinetic energy through fingertips',
  'algorithmic harmony across the keyboard',
];

export function getRandomChallengeMessage(excludeMessage?: string): string {
  const pool = excludeMessage
    ? CHALLENGE_MESSAGES.filter((msg) => msg.toLowerCase() !== excludeMessage.toLowerCase())
    : CHALLENGE_MESSAGES;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] || CHALLENGE_MESSAGES[0];
}
