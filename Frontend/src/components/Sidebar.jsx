import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  LogOut,
  Gamepad2,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * The console rail. Deep violet on a light app body so the chrome reads as a
 * studio tool rather than another grey admin template.
 */
const Sidebar = ({ collapsed, onToggle, onNavigate }) => {
  const { admin, logout } = useAuth();

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    ...(admin?.role === 'super_admin' ? [{ to: '/admins', label: 'Admins', icon: Users }] : []),
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 248 }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
      className="h-screen bg-[#141211] border-r border-[#272522] flex flex-col fixed left-0 top-0 z-40 overflow-hidden shadow-2xl"
    >
      {/* Ambient warm clay glow */}
      <div className="pointer-events-none absolute -top-24 -left-16 h-56 w-56 rounded-full bg-primary-500/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -right-20 h-56 w-56 rounded-full bg-accent-500/10 blur-3xl" />

      <div className="relative flex items-center gap-3 px-4 h-16">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
          <Gamepad2 size={20} />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 flex-1">
            <p className="font-heading font-bold text-white leading-tight tracking-tight">GameCenter</p>
            <p className="text-[11px] uppercase tracking-[0.14em] text-primary-300">Admin Hub</p>
          </motion.div>
        )}
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="rounded-lg p-1.5 text-primary-200 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
        >
          <ChevronLeft
            size={16}
            className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      <nav className="relative flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `relative group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
                isActive ? 'text-white' : 'text-[#C7C0B7] hover:text-white hover:bg-white/[0.04]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebarActivePill"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 shadow-glow"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <item.icon size={18} className="relative z-10 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="relative border-t border-white/10 p-3">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : 'px-1'} py-2`}>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-bold text-white ring-1 ring-white/20">
            {admin?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{admin?.name || 'Admin'}</p>
              <p className="truncate text-xs text-primary-300">{admin?.email || 'Signed in'}</p>
            </div>
          )}
        </div>
        <button
          onClick={logout}
          title={collapsed ? 'Sign out' : undefined}
          className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#C7C0B7] transition-colors hover:bg-red-500/15 hover:text-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${
            collapsed ? 'justify-center px-0' : ''
          }`}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
