import { useState } from 'react';
import { Github, ExternalLink, Code2, BookOpen, Layers, Terminal, Check } from 'lucide-react';

export function GitHubRefCard() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const snippets = [
    {
      title: '1. Frontend Recorder Initialization (TypingDnaRecorder-JavaScript)',
      repo: 'https://github.com/TypingDNA/TypingDnaRecorder-JavaScript',
      code: `// Initialize TypingDNA singleton recorder from typingdna.js
const tdna = new TypingDNA();

// Register target input field for passcode capture
tdna.addTarget('passcode-input');

// Retrieve serialized typing biometric pattern (Type 1 or 2)
const typingPattern = tdna.getTypingPattern({
  type: 1,
  text: passcode,
  targetId: 'passcode-input'
});

// Check biometric pattern strength/quality (0 to 1)
const quality = TypingDNA.getQuality(typingPattern);`,
    },
    {
      title: '2. Backend Authentication API Client (TypingDnaClient-NodeJs)',
      repo: 'https://github.com/TypingDNA/TypingDnaClient-NodeJs',
      code: `// Node.js client invocation (/api/typingdna/match)
const TypingDnaClient = require('typingdnaclient');
const client = new TypingDnaClient(API_KEY, API_SECRET);

// Verify current typing pattern against enrolled baseline
client.match(enrolledPattern, attemptPattern, quality, (err, result) => {
  if (err) console.error(err);
  console.log('Biometric match score:', result.net_score);
  console.log('Result passed (1 or 0):', result.result);
});`,
    },
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-100">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                TypingDNA GitHub Repository Integration
              </h2>
              <p className="text-xs text-slate-400">
                Official open-source typing biometrics library powering this application
              </p>
            </div>
          </div>

          <a
            href="https://github.com/TypingDNA/TypingDnaRecorder-JavaScript"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono transition-colors border border-slate-700"
          >
            <span>TypingDnaRecorder-JavaScript</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Repository Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 font-mono flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  TypingDnaRecorder-JavaScript
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  Apache-2.0
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                JavaScript class for recording typing biometrics information & keystroke patterns directly inside the browser. Loaded locally in this project at <code className="text-cyan-300 font-mono">/public/typingdna.js</code>.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">Version: 3.2</span>
              <a
                href="https://github.com/TypingDNA/TypingDnaRecorder-JavaScript"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline inline-flex items-center gap-1"
              >
                View Repo <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 font-mono flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-violet-400" />
                  TypingDnaClient-NodeJs
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800 font-mono">
                  Node.js API
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Backend SDK proxy pattern implemented in <code className="text-violet-300 font-mono">server.ts</code> supporting cloud biometric matching (<code className="text-slate-300 font-mono">/match</code> and <code className="text-slate-300 font-mono">/verify</code>) with optional API credentials.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">api.typingdna.com</span>
              <a
                href="https://github.com/TypingDNA/TypingDnaClient-NodeJs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:underline inline-flex items-center gap-1"
              >
                View Repo <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Code Snippets */}
        <div className="mt-6 space-y-4">
          {snippets.map((snip, idx) => (
            <div key={idx} className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
                <span className="font-mono text-slate-300 font-semibold">{snip.title}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(snip.code, idx)}
                  className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors font-mono"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <span>Copy Code</span>
                  )}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-cyan-300/90 overflow-x-auto leading-relaxed selection:bg-cyan-500/20">
                {snip.code}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
