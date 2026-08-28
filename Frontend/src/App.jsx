import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Overview from './pages/Overview';
import Projects from './pages/Projects';
import Questions from './pages/Questions';
import Admins from './pages/Admins';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';

const Booting = () => (
  <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-400 animate-pulse" />
    <p className="text-sm text-muted">Connecting to your game center…</p>
  </div>
);

/** Pages that need a session. Redirects to /login when there isn't one. */
const RequireAuth = () => {
  const { status } = useAuth();
  if (status === 'checking') return <Booting />;
  if (status !== 'authenticated') return <Navigate to="/login" replace />;
  return <Layout />;
};

/** The login screen itself is pointless once you're signed in. */
const LoginRoute = () => {
  const { status } = useAuth();
  if (status === 'checking') return <Booting />;
  if (status === 'authenticated') return <Navigate to="/" replace />;
  return <Login />;
};

const App = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<LoginRoute />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Overview />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id/questions" element={<Questions />} />
          <Route path="/admins" element={<Admins />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default App;
