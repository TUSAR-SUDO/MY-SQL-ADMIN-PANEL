import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const roleLabels = {
  super_admin: 'Super admin',
  sub_admin: 'Sub admin',
};

const Topbar = ({ title, subtitle, eyebrow, onToggleSidebar }) => {
  const { admin } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-panel/80 px-4 backdrop-blur-md sm:px-6">
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
            <h1 className="truncate text-lg font-bold text-ink">{title}</h1>
            {subtitle && (
              <span className="hidden truncate text-sm text-muted lg:inline">— {subtitle}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-ink">{admin?.name || 'Admin'}</p>
          <p className="text-xs text-muted">{roleLabels[admin?.role] || admin?.email || ''}</p>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient text-sm font-bold text-white shadow-glow">
          {admin?.name?.[0]?.toUpperCase() || 'A'}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
