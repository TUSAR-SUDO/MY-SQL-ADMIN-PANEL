import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Inbox, PlugZap, RotateCw } from 'lucide-react';

/**
 * One table for every list in the panel.
 *
 * `error` exists so a failed request never looks like an empty collection —
 * "we couldn't reach the API" and "you haven't added anything yet" are
 * different problems and need different next steps.
 */
const DataTable = ({
  columns,
  data = [],
  keyField = '_id',
  onRowClick,
  emptyMessage = 'Nothing here yet',
  emptyHint,
  emptyAction,
  error,
  onRetry,
  page,
  total,
  limit,
  onPageChange,
  loading,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const skeletonRows = Array.from({ length: 4 });

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line bg-surface">
              {columns.map((col) => (
                <th key={col.key} className="table-header">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              skeletonRows.map((_, idx) => (
                <tr key={idx} className="border-b border-line/60 last:border-0">
                  {columns.map((col) => (
                    <td key={col.key} className="table-cell">
                      <div className="skeleton h-4" style={{ width: `${55 + ((idx * 13) % 40)}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-14 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-500">
                      <PlugZap size={26} />
                    </div>
                    <p className="font-heading text-base font-bold text-ink">Couldn't load this list</p>
                    <p className="text-sm text-muted">{error}</p>
                    {onRetry && (
                      <button onClick={onRetry} className="btn-secondary mt-1">
                        <RotateCw size={15} />
                        Try again
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-14 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                    <div className="grid h-14 w-14 animate-float place-items-center rounded-2xl bg-brand-soft text-primary-500 ring-1 ring-primary-100">
                      <Inbox size={26} />
                    </div>
                    <p className="font-heading text-base font-bold text-ink">{emptyMessage}</p>
                    {emptyHint && <p className="text-sm text-muted">{emptyHint}</p>}
                    {emptyAction}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <motion.tr
                  key={row[keyField]}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(idx, 8) * 0.03 }}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-line/60 transition-colors last:border-0 ${
                    onRowClick ? 'cursor-pointer hover:bg-primary-50/60' : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="table-cell">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && !error && (
        <div className="flex items-center justify-between gap-3 border-t border-line bg-surface/60 px-4 py-3">
          <p className="text-sm text-muted">
            Showing {data.length} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
              className="rounded-lg border border-line bg-panel p-1.5 text-muted transition-colors hover:border-primary-200 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-ink">
              {page} <span className="font-normal text-muted">/ {totalPages}</span>
            </span>
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              aria-label="Next page"
              className="rounded-lg border border-line bg-panel p-1.5 text-muted transition-colors hover:border-primary-200 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
