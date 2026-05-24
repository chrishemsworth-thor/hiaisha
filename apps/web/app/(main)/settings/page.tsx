'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getMe, updateProfile, uploadAvatar, changePassword, updateNotificationSettings, resendVerification } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
import type { User } from '@hiaisha/types';

type Section = 'profile' | 'security' | 'notifications';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [bio, setBio] = useState('');
  const [bioSaving, setBioSaving] = useState(false);
  const [bioMsg, setBioMsg] = useState('');

  // Avatar state
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Notifications state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifMsg, setNotifMsg] = useState('');

  // Resend verification
  const [resendPending, setResendPending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    getMe().then(res => {
      if (res.data) {
        setUser(res.data);
        setBio(res.data.bio ?? '');
        setEmailNotifications((res.data as any).notification_emails !== 0);
      }
      setLoading(false);
    }).catch(() => {
      router.push('/login');
    });
  }, []);

  // ── Profile: bio ──────────────────────────────────────────────────────────
  async function handleSaveBio(e: React.FormEvent) {
    e.preventDefault();
    setBioSaving(true);
    setBioMsg('');
    try {
      const res = await updateProfile({ bio: bio.trim() || undefined });
      if (res.data) {
        setUser(res.data);
        setBioMsg('Bio updated!');
      }
    } catch (err: any) {
      setBioMsg(err.message ?? 'Failed to update bio');
    } finally {
      setBioSaving(false);
      setTimeout(() => setBioMsg(''), 3000);
    }
  }

  // ── Avatar ────────────────────────────────────────────────────────────────
  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarMsg('Only JPEG, PNG, WebP allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarMsg('Image must be 5MB or less');
      return;
    }
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarMsg('');
    handleUploadAvatar(file);
  }

  async function handleUploadAvatar(file: File) {
    setAvatarSaving(true);
    setAvatarMsg('');
    try {
      const updatedUser = await uploadAvatar(file);
      setUser(updatedUser);
      setAvatarMsg('Avatar updated!');
    } catch (err: any) {
      setAvatarMsg(err.message ?? 'Failed to upload avatar');
      setAvatarPreview(null);
    } finally {
      setAvatarSaving(false);
      setTimeout(() => setAvatarMsg(''), 3000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // ── Password ──────────────────────────────────────────────────────────────
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordMsg('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (oldPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword({ old_password: oldPassword, new_password: newPassword });
      setPasswordMsg('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message ?? 'Failed to change password');
    } finally {
      setPasswordSaving(false);
      setTimeout(() => setPasswordMsg(''), 4000);
    }
  }

  // ── Notifications ─────────────────────────────────────────────────────────
  async function handleToggleNotifications(value: boolean) {
    setEmailNotifications(value);
    setNotifSaving(true);
    setNotifMsg('');
    try {
      await updateNotificationSettings(value);
      setNotifMsg('Preferences saved!');
    } catch (err: any) {
      setEmailNotifications(!value); // Revert on error
      setNotifMsg(err.message ?? 'Failed to save');
    } finally {
      setNotifSaving(false);
      setTimeout(() => setNotifMsg(''), 3000);
    }
  }

  // ── Resend verification ───────────────────────────────────────────────────
  async function handleResendVerification() {
    setResendPending(true);
    setResendMsg('');
    try {
      await resendVerification();
      setResendMsg('Verification email sent! Check your inbox.');
    } catch {
      setResendMsg('Failed to send — please try again later.');
    } finally {
      setResendPending(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 bg-white rounded animate-pulse w-48" />
        <div className="h-64 bg-white rounded-card animate-pulse" />
      </div>
    );
  }

  if (!user) return null;

  const currentAvatar = avatarPreview ?? user.avatar_url;
  const initials = user.username.slice(0, 2).toUpperCase();

  const sections: { key: Section; label: string; icon: string }[] = [
    { key: 'profile', label: 'Profile', icon: '👤' },
    { key: 'security', label: 'Security', icon: '🔒' },
    { key: 'notifications', label: 'Notifications', icon: '🔔' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display font-bold text-2xl mb-6">Settings</h1>

      <div className="flex gap-1 mb-6 bg-white rounded-lg border border-gray-200 p-1">
        {sections.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
              activeSection === s.key
                ? 'bg-primary text-white'
                : 'text-muted hover:text-[#1A1A1A]'
            }`}
          >
            <span className="mr-1.5">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Profile ──────────────────────────────────────────────────────── */}
      {activeSection === 'profile' && (
        <div className="space-y-4">
          {/* Email verification banner */}
          {!user.email_verified && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">Email not verified</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Verify your email to unlock all features.
                </p>
                {resendMsg ? (
                  <p className="text-xs font-medium text-amber-700 mt-1">{resendMsg}</p>
                ) : (
                  <button
                    onClick={handleResendVerification}
                    disabled={resendPending}
                    className="text-xs text-primary hover:underline mt-1 disabled:opacity-50"
                  >
                    {resendPending ? 'Sending...' : 'Resend verification email'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Avatar */}
          <div className="bg-white rounded-card border border-gray-200 p-5">
            <h2 className="font-semibold text-base mb-4">Profile Photo</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt={user.username}
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
                    {initials}
                  </div>
                )}
                {avatarSaving && (
                  <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center">
                    <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarSaving}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:border-primary hover:text-primary disabled:opacity-50 transition-colors"
                >
                  {avatarSaving ? 'Uploading...' : 'Change photo'}
                </button>
                <p className="text-xs text-muted mt-1">JPEG, PNG, WebP · max 5MB</p>
                {avatarMsg && (
                  <p className={`text-xs mt-1 font-medium ${avatarMsg.includes('!') ? 'text-green-600' : 'text-red-500'}`}>
                    {avatarMsg}
                  </p>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarFileChange}
              className="hidden"
            />
          </div>

          {/* Bio */}
          <div className="bg-white rounded-card border border-gray-200 p-5">
            <h2 className="font-semibold text-base mb-4">Bio</h2>
            <form onSubmit={handleSaveBio} className="space-y-3">
              <div>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Tell the community about yourself — your favourite makan spots, what you love to eat..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
                />
                <p className="text-xs text-muted text-right mt-0.5">{bio.length}/500</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={bioSaving}
                  className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
                >
                  {bioSaving ? 'Saving...' : 'Save bio'}
                </button>
                {bioMsg && (
                  <span className={`text-sm font-medium ${bioMsg.includes('!') ? 'text-green-600' : 'text-red-500'}`}>
                    {bioMsg}
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Read-only info */}
          <div className="bg-white rounded-card border border-gray-200 p-5">
            <h2 className="font-semibold text-base mb-4">Account Info</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Username</span>
                <span className="font-medium">@{user.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Email</span>
                <span className="font-medium flex items-center gap-1.5">
                  {user.email}
                  {user.email_verified ? (
                    <span className="text-green-600 text-xs">✓ verified</span>
                  ) : (
                    <span className="text-amber-500 text-xs">⚠ unverified</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Karma</span>
                <span className="font-medium text-accent">{user.karma} pts</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Security ─────────────────────────────────────────────────────── */}
      {activeSection === 'security' && (
        <div className="bg-white rounded-card border border-gray-200 p-5">
          <h2 className="font-semibold text-base mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Current password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                placeholder="Enter your current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                placeholder="Min. 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                placeholder="Repeat your new password"
              />
            </div>
            {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={passwordSaving}
                className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
              >
                {passwordSaving ? 'Changing...' : 'Change password'}
              </button>
              {passwordMsg && (
                <span className="text-sm font-medium text-green-600">{passwordMsg}</span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ── Notifications ─────────────────────────────────────────────────── */}
      {activeSection === 'notifications' && (
        <div className="bg-white rounded-card border border-gray-200 p-5">
          <h2 className="font-semibold text-base mb-4">Email Notifications</h2>
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={emailNotifications}
                  onChange={e => handleToggleNotifications(e.target.checked)}
                  disabled={notifSaving}
                />
                <div
                  onClick={() => !notifSaving && handleToggleNotifications(!emailNotifications)}
                  className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${emailNotifications ? 'bg-primary' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${emailNotifications ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Email notifications</p>
                <p className="text-xs text-muted mt-0.5">
                  Receive email updates for replies to your posts and comments, mentions, and community announcements.
                </p>
              </div>
            </label>

            {notifMsg && (
              <p className={`text-sm font-medium ${notifMsg.includes('!') ? 'text-green-600' : 'text-red-500'}`}>
                {notifMsg}
              </p>
            )}

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-muted">
                Note: Transactional emails (email verification, password reset) are always sent regardless of this setting.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
