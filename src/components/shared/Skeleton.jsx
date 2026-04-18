import { cn } from '../../lib/cn';

/**
 * Skeleton — animated loading placeholder.
 * Uses the shimmer animation defined in the design system.
 */
function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-lg bg-bg-hover/60 animate-shimmer',
        'bg-gradient-to-r from-bg-hover/40 via-bg-hover/80 to-bg-hover/40 bg-[length:400%_100%]',
        className
      )}
      {...props}
    />
  );
}

/** Skeleton stat card — matches StatCard layout */
export function SkeletonStatCard() {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-4">
      <Skeleton className="w-8 h-8 rounded mb-3" />
      <Skeleton className="w-24 h-7 mb-2" />
      <Skeleton className="w-16 h-3" />
    </div>
  );
}

/** Skeleton table rows */
export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 border-b border-border bg-bg-tertiary">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-4 py-3 border-b border-border last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn('h-4 flex-1', c === 0 && 'max-w-[180px]')} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Skeleton product grid */
export function SkeletonProductGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-bg-secondary p-3">
          <Skeleton className="w-full h-24 rounded-lg mb-3" />
          <Skeleton className="w-3/4 h-4 mb-2" />
          <Skeleton className="w-1/2 h-4" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton chart */
export function SkeletonChart() {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-5">
      <Skeleton className="w-40 h-5 mb-4" />
      <div className="flex items-end gap-2 h-40">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <Skeleton className="w-full rounded-t-md" style={{ height: `${20 + Math.random() * 60}%` }} />
            <Skeleton className="w-8 h-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full page loading overlay */
export function PageLoader() {
  return (
    <div className="flex flex-col gap-6 h-full animate-fade-in-up">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <Skeleton className="w-40 h-8 mb-2" />
          <Skeleton className="w-60 h-4" />
        </div>
        <Skeleton className="w-32 h-9 rounded-lg" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
      </div>
      <SkeletonTable rows={6} cols={5} />
    </div>
  );
}

export default Skeleton;
