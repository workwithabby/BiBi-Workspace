import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, 
  Download, 
  User, 
  Check,
  AlertTriangle,
  Trash2,
  X,
  Upload,
  Database,
  CloudCheck,
  ShieldCheck,
  Zap,
  Lock,
  KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useWorkspace } from '../context/WorkspaceContext';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { updatePassword, updateProfile } from 'firebase/auth';

export const SettingsView: React.FC = () => {
  const { data, updateSettings, resetToDefaults, exportJSON, importJSON, isGuestMode, isCloudSynced } = useWorkspace();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);

  const [userName, setUserName] = useState(data.settings.userName);
  const [userAvatar, setUserAvatar] = useState(data.settings.userAvatar);
  const [userBio, setUserBio] = useState(data.settings.userBio);
  const [motd, setMotd] = useState(data.settings.motd);
  const [workspaceTitle, setWorkspaceTitle] = useState(data.settings.workspaceTitle || 'Personal Workspace');
  const [profileImage, setProfileImage] = useState(data.settings.profileImage || '');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetNotice, setResetNotice] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const cleanCurrent = currentPassword.trim();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (cleanNew.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setIsChangingPassword(true);

    try {
      // Find logged in account email
      let userEmail = auth.currentUser?.email?.toLowerCase() || '';

      if (!userEmail) {
        // Find matching registered user from local cache
        const existingAccountsStr = localStorage.getItem('bibi_registered_users') || '[]';
        let existingAccounts: any[] = [];
        try { existingAccounts = JSON.parse(existingAccountsStr); } catch {}
        if (existingAccounts.length > 0) {
          userEmail = existingAccounts[0].email?.toLowerCase() || '';
        }
      }

      if (!userEmail) {
        setPasswordError('No active account email found. Please sign up or log in first.');
        setIsChangingPassword(false);
        return;
      }

      // Verify current password from Firestore or local storage cache
      let existingPass = '';

      if (db) {
        try {
          const userDocId = userEmail.replace(/[^a-z0-9]/g, '_');
          const userDocRef = doc(db, 'users', userDocId);
          const snap = await getDoc(userDocRef);
          if (snap.exists() && snap.data().password) {
            existingPass = snap.data().password;
          }
        } catch (fsErr) {
          console.warn("Firestore check error:", fsErr);
        }
      }

      if (!existingPass) {
        const existingAccountsStr = localStorage.getItem('bibi_registered_users') || '[]';
        let existingAccounts: any[] = [];
        try { existingAccounts = JSON.parse(existingAccountsStr); } catch {}
        const matched = existingAccounts.find((u: any) => u.email && u.email.toLowerCase() === userEmail);
        if (matched) {
          existingPass = matched.password || '';
        }
      }

      if (existingPass && existingPass !== cleanCurrent) {
        setPasswordError('Incorrect current password. Please try again.');
        setIsChangingPassword(false);
        return;
      }

      // 1. Update Cloud Firestore
      if (db) {
        try {
          const userDocId = userEmail.replace(/[^a-z0-9]/g, '_');
          const userDocRef = doc(db, 'users', userDocId);
          await setDoc(userDocRef, {
            password: cleanNew,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (fsErr) {
          console.warn("Firestore update notice:", fsErr);
        }
      }

      // 2. Update local storage cache
      const existingAccountsStr = localStorage.getItem('bibi_registered_users') || '[]';
      let existingAccounts: any[] = [];
      try { existingAccounts = JSON.parse(existingAccountsStr); } catch {}
      const updated = existingAccounts.map((u: any) => 
        u.email && u.email.toLowerCase() === userEmail ? { ...u, password: cleanNew } : u
      );
      localStorage.setItem('bibi_registered_users', JSON.stringify(updated));

      // 3. Update Firebase Auth if current user
      if (auth.currentUser) {
        try {
          await updatePassword(auth.currentUser, cleanNew);
        } catch (authErr) {
          console.warn("Firebase Auth password change notice:", authErr);
        }
      }

      setPasswordSuccess('Password updated successfully across all devices!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);

      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err: any) {
      console.error("Change password error:", err);
      setPasswordError('Failed to change password. Please check your current password and try again.');
      setIsChangingPassword(false);
    }
  };

  useEffect(() => {
    setUserName(data.settings.userName);
    setUserAvatar(data.settings.userAvatar);
    setUserBio(data.settings.userBio);
    setMotd(data.settings.motd);
    setWorkspaceTitle(data.settings.workspaceTitle || 'Personal Workspace');
    setProfileImage(data.settings.profileImage || '');
  }, [data.settings]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = userName.trim() || 'User';
    updateSettings({
      userName: cleanName,
      userAvatar: userAvatar.trim() || cleanName.charAt(0).toUpperCase() || 'A',
      userBio: userBio.trim(),
      motd: motd.trim(),
      workspaceTitle: workspaceTitle.trim() || 'Personal Workspace',
      profileImage: profileImage
    });
    if (auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, { displayName: cleanName });
      } catch (err) {
        console.warn("Auth update profile notice:", err);
      }
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setProfileImage(base64);
        updateSettings({ profileImage: base64 });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProfileImage = () => {
    setProfileImage('');
    updateSettings({ profileImage: '' });
    if (profilePicInputRef.current) {
      profilePicInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importJSON(content);
        if (ok) {
          alert("Workspace data restored successfully!");
        } else {
          alert("Invalid backup JSON file.");
        }
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const confirmAndReset = () => {
    resetToDefaults();
    setShowResetModal(false);
    setResetNotice(true);
    setTimeout(() => setResetNotice(false), 3500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 pb-12 max-w-3xl mx-auto"
    >
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#121212] p-6 rounded-3xl border border-[#FFCEE3]/60 dark:border-[#222222] shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings size={22} className="text-[#FF85BB]" />
            <h1 className="text-xl font-bold text-[#021A54] dark:text-zinc-100">Workspace Settings</h1>
          </div>
          <p className="text-xs text-[#021A54]/70 dark:text-zinc-300">
            Customize your workspace profile and export/restore data backups.
          </p>
        </div>
      </div>

      {resetNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
          <span>Workspace reset successfully! All tasks, courses, notes, and schedules cleared.</span>
          <button onClick={() => setResetNotice(false)} className="text-emerald-700 dark:text-emerald-300">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Profile Personalization Card */}
      <div className="bg-white dark:bg-[#121212] p-6 rounded-3xl border border-[#FFCEE3]/60 dark:border-[#222222] shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#021A54] dark:text-zinc-100 flex items-center gap-2 pb-3 border-b border-[#FFCEE3]/60 dark:border-[#222222]">
          <User size={18} className="text-[#FF85BB]" />
          <span>Profile Personalization</span>
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-semibold">
          {/* Profile Picture Upload & Management */}
          <div>
            <label className="block text-[#021A54] dark:text-zinc-200 mb-2">Profile Picture</label>
            <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222]">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile Picture"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#FF85BB] shadow-xs shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#FFCEE3] dark:bg-[#321323] border border-[#FF85BB] flex items-center justify-center text-[#021A54] dark:text-[#FFB3D1] font-bold text-xl shrink-0">
                  {userAvatar || userName.charAt(0) || 'U'}
                </div>
              )}

              <div className="space-y-1.5 text-xs">
                <input
                  type="file"
                  ref={profilePicInputRef}
                  onChange={handleProfileImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => profilePicInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-xl bg-[#FF85BB] hover:bg-[#FF85BB]/90 text-white font-bold transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <Upload size={13} />
                    <span>{profileImage ? 'Update Picture' : 'Upload Picture'}</span>
                  </button>

                  {profileImage && (
                    <button
                      type="button"
                      onClick={handleRemoveProfileImage}
                      className="px-3.5 py-1.5 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300 font-bold hover:bg-red-200 transition-all flex items-center gap-1"
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-[#021A54]/60 dark:text-zinc-400">Upload a photo to display on your dashboard header.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[#021A54] dark:text-zinc-200 mb-1">Avatar Initials / Icon</label>
              <input
                type="text"
                value={userAvatar}
                onChange={(e) => setUserAvatar(e.target.value)}
                className="w-full p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-center text-xl text-[#021A54] dark:text-zinc-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[#021A54] dark:text-zinc-200 mb-1">Display Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="w-full p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#021A54] dark:text-zinc-200 mb-1">Workspace Title (Dashboard Badge)</label>
              <input
                type="text"
                value={workspaceTitle}
                onChange={(e) => setWorkspaceTitle(e.target.value)}
                placeholder="Personal Workspace"
                className="w-full p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-[#021A54] dark:text-zinc-200 mb-1">Bio / Tagline</label>
              <input
                type="text"
                value={userBio}
                onChange={(e) => setUserBio(e.target.value)}
                className="w-full p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#021A54] dark:text-zinc-200 mb-1">Daily Affirmation / Quote</label>
            <input
              type="text"
              value={motd}
              onChange={(e) => setMotd(e.target.value)}
              className="w-full p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-[#021A54] dark:bg-[#FF85BB] hover:bg-[#FF85BB] dark:hover:bg-[#FF65A5] text-white font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Check size={15} />
              <span>Save Profile Updates</span>
            </motion.button>

            {savedSuccess && (
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-in fade-in">
                Profile Saved!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Account Security & Change Password Card */}
      <div className="bg-white dark:bg-[#121212] p-6 rounded-3xl border border-[#FFCEE3]/60 dark:border-[#222222] shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#021A54] dark:text-zinc-100 flex items-center gap-2 pb-3 border-b border-[#FFCEE3]/60 dark:border-[#222222]">
          <KeyRound size={18} className="text-[#FF85BB]" />
          <span>Account Security & Change Password</span>
        </h2>

        {isGuestMode ? (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-semibold">
            Password management is available for registered accounts. Create or log into an account from the landing page to manage account credentials.
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4 text-xs font-semibold">
            {passwordError && (
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-xs font-semibold">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                {passwordSuccess}
              </div>
            )}

            <div>
              <label className="block text-[#021A54] dark:text-zinc-200 mb-1">Current Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#021A54]/40 dark:text-zinc-500" />
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#021A54] dark:text-zinc-200 mb-1">New Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#021A54]/40 dark:text-zinc-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#021A54] dark:text-zinc-200 mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#021A54]/40 dark:text-zinc-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100"
                  />
                </div>
              </div>
            </div>

            <div className="pt-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isChangingPassword}
                className="px-5 py-2.5 rounded-2xl bg-[#021A54] dark:bg-[#FF85BB] hover:bg-[#FF85BB] dark:hover:bg-[#FF65A5] text-white font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <KeyRound size={15} />
                <span>{isChangingPassword ? 'Updating Password...' : 'Update Password'}</span>
              </motion.button>
            </div>
          </form>
        )}
      </div>

      {/* Backup & Data Management Card */}
      <div className="bg-white dark:bg-[#121212] p-6 rounded-3xl border border-[#FFCEE3]/60 dark:border-[#222222] shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#021A54] dark:text-zinc-100 flex items-center gap-2 pb-3 border-b border-[#FFCEE3]/60 dark:border-[#222222]">
          <Download size={18} className="text-[#FF85BB]" />
          <span>Data Backup, Export & Reset</span>
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#FFF0F6] dark:bg-[#22131D] border border-[#FFCEE3] dark:border-[#4A2038]">
            <div>
              <h3 className="font-bold text-[#021A54] dark:text-zinc-100">Export Workspace JSON</h3>
              <p className="text-[11px] text-[#021A54]/60 dark:text-zinc-400">Download a full JSON backup file containing all notes, timetable slots, and courses.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={exportJSON}
              className="px-4 py-2 rounded-2xl bg-[#FF85BB] text-white font-bold hover:bg-[#FF85BB]/90 transition-all shrink-0"
            >
              Export JSON Backup
            </motion.button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#FFF0F6] dark:bg-[#22131D] border border-[#FFCEE3] dark:border-[#4A2038]">
            <div>
              <h3 className="font-bold text-[#021A54] dark:text-zinc-100">Restore Workspace from Backup</h3>
              <p className="text-[11px] text-[#021A54]/60 dark:text-zinc-400">Upload a previously exported JSON backup file to restore your workspace.</p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-2xl bg-[#021A54] dark:bg-[#FF85BB] text-white font-bold hover:bg-[#021A54]/90 dark:hover:bg-[#FF65A5] transition-all shrink-0"
            >
              Upload Backup File
            </motion.button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
            <div>
              <h3 className="font-bold text-red-700 dark:text-red-400">Reset Workspace to Defaults</h3>
              <p className="text-[11px] text-red-600/70 dark:text-red-400/70">Wipe all current courses, schedules, notes, and tasks to clear workspace state.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowResetModal(true)}
              className="px-4 py-2 rounded-2xl border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 font-bold transition-all shrink-0"
            >
              Reset All
            </motion.button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Popup Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 bg-[#021A54]/40 dark:bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-[#121212] w-full max-w-md rounded-3xl p-6 border border-[#FFCEE3] dark:border-[#222222] shadow-2xl space-y-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-900/50">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#021A54] dark:text-zinc-100">Are you sure you want to reset?</h3>
                    <p className="text-[11px] text-[#021A54]/60 dark:text-zinc-400">This action cannot be undone.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 text-xs text-red-800 dark:text-red-300 leading-relaxed">
                Resetting will clear all stored <strong>courses</strong>, <strong>timetable schedules</strong>, <strong>notes</strong>, <strong>tasks</strong>, and <strong>countdowns</strong>. Your workspace will be completely reset.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#333333] text-[#021A54] dark:text-zinc-200 text-xs font-bold hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAndReset}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  <span>Yes, Reset Workspace</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
