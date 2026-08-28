import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

/** Ordered most-specific first so the questions route wins over /projects. */
const pageMeta = [
  {
    match: /^\/projects\/[^/]+\/questions$/,
    eyebrow: 'Project',
    title: 'Question bank',
    subtitle: 'Everything this game can ask',
  },
  { match: /^\/projects$/, eyebrow: 'Library', title: 'Projects', subtitle: 'Your games and their question banks' },
  { match: /^\/admins$/, eyebrow: 'Team', title: 'Admins', subtitle: 'Who can manage this panel' },
  { match: /^\/settings$/, eyebrow: 'Account', title: 'Settings', subtitle: 'Your profile and password' },
  { match: /^\/$/, eyebrow: 'Dashboard', title: 'Overview', subtitle: 'How your games are doing' },
];

const resolveMeta = (pathname) =>
  pageMeta.find((entry) => entry.match.test(pathname)) || { title: 'GameCenter', subtitle: '' };

const Layout = () => {
  // Narrow screens start collapsed: 76px of rail instead of 248px of overlay.
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );
  const location = useLocation();
  const meta = resolveMeta(location.pathname);

  // On mobile, collapse the sidebar after the user taps a nav link.
  const handleNavClick = () => {
    if (window.innerWidth < 768) setCollapsed(true);
  };

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = (event) => setCollapsed(event.matches);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return (
    <div className="relative min-h-screen bg-surface overflow-x-hidden">
      {/* Subtle Anthropic warm ambient lighting */}
      <div className="pointer-events-none fixed top-0 right-1/4 h-96 w-96 rounded-full bg-primary-500/[0.08] dark:bg-primary-500/[0.07] blur-[140px] animate-pulse-slow -z-10" />
      <div className="pointer-events-none fixed bottom-10 right-10 h-96 w-96 rounded-full bg-accent-500/[0.06] dark:bg-accent-500/[0.05] blur-[150px] -z-10" />

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} onNavigate={handleNavClick} />
      <div className="transition-[margin] duration-200" style={{ marginLeft: collapsed ? 76 : 248 }}>
        <Topbar
          eyebrow={meta.eyebrow}
          title={meta.title}
          subtitle={meta.subtitle}
          onToggleSidebar={() => setCollapsed((v) => !v)}
        />
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="mx-auto max-w-7xl p-4 sm:p-6"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
};

export default Layout;
