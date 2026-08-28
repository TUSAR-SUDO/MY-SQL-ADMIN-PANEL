import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Sun, Moon, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const roleLabels = {
  super_admin: 'Super admin',
  sub_admin: 'Sub admin',
};

const Topbar = ({ title, subtitle, eyebrow, onToggleSidebar }) => {
  const { admin } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-panel/75 px-4 backdrop-blur-xl sm:px-6 transition-colors duration-300">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="btn-ghost -ml-1 h-9 w-9 rounded-xl p-0 md:hidden"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <div className="flex min-w-0 items-baseline gap-2">
            <h1 className="truncate text-lg font-bold text-ink tracking-tight">{title}</h1>
            {subtitle && (
              <span className="hidden truncate text-sm text-muted lg:inline">— {subtitle}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Animated Theme Toggle Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-ink hover:border-primary-400 hover:shadow-glow transition-all"
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isDark ? 'dark' : 'light'}
              initial={{ y: -10, opacity: 0, rotate: -45 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: 10, opacity: 0, rotate: 45 }}
              transition={{ duration: 0.2 }}
            >
              {isDark ? (
                <Sun size={17} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
              ) : (
                <Moon size={17} className="text-primary-600 drop-shadow-[0_0_8px_rgba(124,58,237,0.4)]" />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-ink">{admin?.name || 'Admin'}</p>
          <p className="text-xs text-muted">{roleLabels[admin?.role] || admin?.email || ''}</p>
        </div>
        <motion.div
          whileHover={{ scale: 1.08 }}
          className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient text-sm font-bold text-white shadow-glow cursor-default"
        >
          {admin?.name?.[0]?.toUpperCase() || 'A'}
        </motion.div>
      </div>
    </header>
  );
};

export default Topbar;
