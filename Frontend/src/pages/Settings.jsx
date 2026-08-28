import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Shield,
  Mail,
  Lock,
  KeyRound,
  Plug,
  LogOut,
  Save,
  Loader2,
  Globe,
  Plus,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { updateMe, getSettings, updateSettings } from '../api';

const Card = ({ icon: Icon, title, subtitle, delay = 0, children }) => (
  <motion.section
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, delay }}
    className="card p-6"
  >
    <div className="mb-6 flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-600">
        <Icon size={19} />
      </div>
      <div>
        <h2 className="font-bold text-ink">{title}</h2>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
    </div>
    {children}
  </motion.section>
);

const Settings = () => {
  const { admin, refreshAdmin, logout } = useAuth();
  const [name, setName] = useState(admin?.name || '');
  const [email, setEmail] = useState(admin?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [publicApiBase, setPublicApiBase] = useState('');
  const [allowedGameOrigins, setAllowedGameOrigins] = useState([]);
  const [newOrigin, setNewOrigin] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getSettings();
        setPublicApiBase(res.data.publicApiBase || '');
        setAllowedGameOrigins(res.data.allowedGameOrigins || []);
      } catch {
        // ignore
      } finally {
        setLoadingSettings(false);
      }
    };
    load();
  }, []);

  const handleProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await updateMe({ name, email });
      localStorage.setItem('admin', JSON.stringify(res.data));
      if (refreshAdmin) refreshAdmin(res.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("The new passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Use at least 6 characters');
      return;
    }
    setSavingPassword(true);
    try {
      await updateMe({ currentPassword, newPassword });
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await updateSettings({ publicApiBase, allowedGameOrigins: allowedGameOrigins.join(',') });
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const addOrigin = () => {
    const url = newOrigin.trim().replace(/\/$/, '');
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast.error('Enter a full URL starting with https://');
      return;
    }
    if (allowedGameOrigins.includes(url)) {
      toast.error('Already added');
      return;
    }
    setAllowedGameOrigins([...allowedGameOrigins, url]);
    setNewOrigin('');
  };

  const removeOrigin = (origin) => {
    setAllowedGameOrigins(allowedGameOrigins.filter((o) => o !== origin));
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Card icon={User} title="Profile" subtitle="Your name and sign-in email">
        <form onSubmit={handleProfile} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input" required />
            </div>
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  required
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <Shield size={14} />
            {admin?.role === 'super_admin'
              ? 'Super admin — you can add and remove other admins.'
              : 'Sub admin — you can manage projects and questions.'}
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </Card>

      <Card
        icon={KeyRound}
        title="Password"
        subtitle="Confirm the current one to set a new one"
        delay={0.08}
      >
        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <label className="label">Current password</label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input pl-10"
                autoComplete="current-password"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">New password</label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input pl-10"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={savingPassword}>
              {savingPassword ? 'Updating…' : 'Change password'}
            </button>
          </div>
        </form>
      </Card>

      <Card
        icon={Plug}
        title="Game integration"
        subtitle="Public API base URL and allowed game origins"
        delay={0.16}
      >
        {loadingSettings ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="label">Public API base URL</label>
              <input
                value={publicApiBase}
                onChange={(e) => setPublicApiBase(e.target.value)}
                className="input"
                placeholder="https://admin-panel-xxxx.onrender.com"
              />
              <p className="hint">
                Games call <code className="font-mono text-xs text-primary-700">/api/public/projects/&lt;slug&gt;/session</code> on
                this URL. Set allowed game origins below.
              </p>
            </div>

            <div>
              <label className="label">Allowed game origins (global)</label>
              <div className="flex gap-2">
                <input
                  value={newOrigin}
                  onChange={(e) => setNewOrigin(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOrigin();
                    }
                  }}
                  className="input flex-1"
                  placeholder="https://my-game.vercel.app"
                />
                <button
                  type="button"
                  onClick={addOrigin}
                  className="btn-secondary px-3"
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="hint">
                Add game URLs here so CORS allows them to fetch questions. These apply globally — you can also set origins per project.
              </p>
              {allowedGameOrigins.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {allowedGameOrigins.map((origin) => (
                    <div
                      key={origin}
                      className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Globe size={12} className="shrink-0 text-primary-500" />
                        <code className="truncate font-mono text-xs text-ink">{origin}</code>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeOrigin(origin)}
                        className="shrink-0 rounded p-0.5 text-muted hover:bg-red-50 hover:text-red-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="btn-primary px-4 py-2 text-xs"
                disabled={savingSettings}
              >
                {savingSettings ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {savingSettings ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </Card>

      <Card icon={LogOut} title="Session" subtitle="Sign out of this browser" delay={0.24}>
        <button onClick={logout} className="btn-secondary">
          <LogOut size={16} />
          Sign out
        </button>
      </Card>
    </div>
  );
};

export default Settings;
