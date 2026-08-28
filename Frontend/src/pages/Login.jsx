import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gamepad2, Mail, Lock, LogIn, User, Sparkles, Plug } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getSetupStatus, setupAdmin } from '../api';

const Field = ({ icon: Icon, label, hint, ...inputProps }) => (
  <div>
    <label className="label">{label}</label>
    <div className="relative">
      <Icon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
      <input className="input pl-10" {...inputProps} />
    </div>
    {hint && <p className="hint">{hint}</p>}
  </div>
);

const Login = () => {
  const [setupRequired, setSetupRequired] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const { login, setAuthFromToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getSetupStatus()
      .then((res) => setSetupRequired(res.data.setupRequired))
      .catch(() => setSetupRequired(false));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');
    try {
      await login(email, password);
      toast.success('Welcome back');
      navigate('/projects');
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.response ? 'Login failed' : "Can't reach the API — is the backend running?");
      setFormError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');
    try {
      const res = await setupAdmin({ name, email, password });
      setAuthFromToken(res.data.token, res.data.admin);
      toast.success('Account created — welcome to GameCenter');
      navigate('/projects');
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.response ? 'Setup failed' : "Can't reach the API — is the backend running?");
      setFormError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (setupRequired === null) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Pitch side — says what the panel is for, in the product's own words. */}
      <aside className="relative hidden overflow-hidden bg-[#0d0a1d] border-r border-[#221c44] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-primary-600/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-accent-500/25 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
            <Gamepad2 size={22} />
          </div>
          <p className="font-heading text-lg font-bold text-white">GameCenter</p>
        </div>

        <div className="relative max-w-md">
          <p className="eyebrow text-accent-300">Question bank</p>
          <h2 className="mt-3 font-heading text-4xl font-extrabold leading-[1.1] text-white">
            Write the questions here.
            <br />
            <span className="bg-gradient-to-r from-primary-300 to-accent-300 bg-clip-text text-transparent">
              Your game reads them live.
            </span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-primary-200">
            Every project gets a public endpoint. Point your game at it and it pulls a fresh,
            shuffled set of questions on each session — no redeploy, no hardcoded arrays.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
            <Plug size={15} className="text-accent-300" />
            <code className="font-mono text-xs text-primary-100">/api/public/projects/&lt;slug&gt;/session</code>
          </div>
        </div>

        <p className="relative text-xs text-primary-300/70">
          Manage projects, question banks and admin accounts in one place.
        </p>
      </aside>

      {/* Form side */}
      <main className="flex items-center justify-center bg-surface p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
              <Gamepad2 size={22} />
            </div>
            <p className="font-heading text-lg font-bold text-ink">GameCenter</p>
          </div>

          <div className="card overflow-hidden">
            <div className="h-1.5 w-full bg-brand-gradient" />
            <div className="p-8">
              <p className="eyebrow">{setupRequired ? 'First run' : 'Sign in'}</p>
              <h1 className="mt-2 text-2xl font-bold text-ink">
                {setupRequired ? 'Create your admin account' : 'Welcome back'}
              </h1>
              <p className="mt-1.5 text-sm text-muted">
                {setupRequired
                  ? 'This becomes the super admin — the only account that can add other admins.'
                  : 'Sign in to manage your games and their question banks.'}
              </p>

              {formError && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400"
                >
                  {formError}
                </div>
              )}

              {setupRequired ? (
                <form onSubmit={handleSetup} className="mt-6 space-y-5">
                  <Field
                    icon={User}
                    label="Full name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Super Admin"
                    autoComplete="name"
                    required
                  />
                  <Field
                    icon={Mail}
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@gamecenter.com"
                    autoComplete="email"
                    required
                  />
                  <Field
                    icon={Lock}
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    hint="You'll use this every time you sign in — pick something you can keep."
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                  <button type="submit" className="btn-primary w-full" disabled={loading}>
                    {loading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Create admin account
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="mt-6 space-y-5">
                  <Field
                    icon={Mail}
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@gamecenter.com"
                    autoComplete="email"
                    required
                  />
                  <Field
                    icon={Lock}
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button type="submit" className="btn-primary w-full" disabled={loading}>
                    {loading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <LogIn size={16} />
                        Sign in
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Login;
