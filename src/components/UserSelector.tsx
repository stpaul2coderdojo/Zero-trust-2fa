import React, { useState } from 'react';
import { User, UserPlus, CheckCircle, AlertCircle, Sparkles, ChevronDown, Trash2, Fingerprint } from 'lucide-react';
import { UserRecord } from '../types';
import { typingDna } from '../lib/typingDnaEngine';
import { soundFX } from '../lib/audioFeedback';

interface UserSelectorProps {
  activeUsername: string;
  onSelectUser: (username: string) => void;
  onStartFirstTimeRecording: (username: string) => void;
}

export function UserSelector({
  activeUsername,
  onSelectUser,
  onStartFirstTimeRecording,
}: UserSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newUsernameInput, setNewUsernameInput] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const usersMap = typingDna.getAllUsers();
  const userList = Object.values(usersMap);
  const activeUser = usersMap[activeUsername.toLowerCase()];
  const isFirstTime = !activeUser || !activeUser.hasEnrolled || !activeUser.profile;

  const handleAddNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newUsernameInput.trim().toLowerCase();
    if (!trimmed) return;

    soundFX.playKeypress(600);
    // If user doesn't exist, create initial record
    if (!usersMap[trimmed]) {
      const newRecord: UserRecord = {
        username: trimmed,
        hasEnrolled: false,
        sampleCount: 0,
      };
      typingDna.saveUser(newRecord);
    }

    typingDna.setActiveUsername(trimmed);
    onSelectUser(trimmed);
    setNewUsernameInput('');
    setShowAddForm(false);
    setIsOpen(false);
  };

  const handleSelect = (uname: string) => {
    soundFX.playKeypress(500);
    typingDna.setActiveUsername(uname);
    onSelectUser(uname);
    setIsOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, uname: string) => {
    e.stopPropagation();
    soundFX.playKeypress(350);
    typingDna.deleteUser(uname);
    const remaining = Object.keys(typingDna.getAllUsers());
    const nextUser = remaining.length > 0 ? remaining[0] : 'alice';
    typingDna.setActiveUsername(nextUser);
    onSelectUser(nextUser);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Active User Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-base shadow-sm">
            <User className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Active User:
              </span>
              <span className="text-sm font-bold font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                @{activeUsername}
              </span>

              {isFirstTime ? (
                <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-950/70 border border-amber-800/70 px-2 py-0.5 rounded-full">
                  <AlertCircle className="w-3 h-3" />
                  First-Time User
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800/70 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Biometrics Enrolled
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-0.5">
              {isFirstTime
                ? 'No typing biometric profile registered for this username yet.'
                : `Biometric profile calibrated (${activeUser.sampleCount} samples). Ready for passwordless typing verification.`}
            </p>
          </div>
        </div>

        {/* Right side controls: Switch/Add User & First-time Action */}
        <div className="flex items-center gap-2">
          {isFirstTime && (
            <button
              type="button"
              id="record-first-time-btn"
              onClick={() => {
                soundFX.playKeypress(650);
                onStartFirstTimeRecording(activeUsername);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-slate-950 font-bold font-mono text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95 flex items-center gap-1.5 animate-pulse"
            >
              <Fingerprint className="w-4 h-4" />
              <span>Record Biometrics (First Time)</span>
            </button>
          )}

          {/* User Switcher Dropdown Trigger */}
          <div className="relative">
            <button
              type="button"
              id="switch-user-btn"
              onClick={() => setIsOpen(!isOpen)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition-colors flex items-center gap-1.5"
            >
              <span>Switch User</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl p-3 shadow-2xl z-40 space-y-2">
                <div className="text-[11px] font-mono text-slate-400 px-1 uppercase tracking-wider">
                  Select or Add Username
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                  {userList.map((u) => (
                    <div
                      key={u.username}
                      onClick={() => handleSelect(u.username)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-mono cursor-pointer transition-colors ${
                        u.username === activeUsername.toLowerCase()
                          ? 'bg-cyan-950/70 border border-cyan-800/80 text-cyan-300'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold">@{u.username}</span>
                        {u.hasEnrolled ? (
                          <span className="text-[9px] text-emerald-400 font-normal">
                            (Enrolled)
                          </span>
                        ) : (
                          <span className="text-[9px] text-amber-400 font-normal">
                            (New)
                          </span>
                        )}
                      </div>

                      {userList.length > 1 && (
                        <button
                          type="button"
                          title="Delete user"
                          onClick={(e) => handleDelete(e, u.username)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add new user form */}
                {showAddForm ? (
                  <form onSubmit={handleAddNewUser} className="pt-2 border-t border-slate-800 space-y-2">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Enter new username..."
                      value={newUsernameInput}
                      onChange={(e) => setNewUsernameInput(e.target.value.replace(/\s+/g, '').toLowerCase())}
                      className="w-full bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-cyan-400"
                    />
                    <div className="flex items-center gap-1.5">
                      <button
                        type="submit"
                        className="flex-1 py-1 px-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="py-1 px-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="w-full pt-2 border-t border-slate-800 flex items-center justify-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 py-1 font-mono transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add New Username</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
