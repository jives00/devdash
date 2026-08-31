'use client';

interface BackupStatus {
  timestamp: string;
  success: boolean;
  sizeMb: number | null;
  error: string | null;
}

// The backup task runs daily at 1am. Anything older than this means it stopped
// running rather than failed — a state the success flag alone cannot express,
// since a stale file keeps reporting the last successful run indefinitely.
const STALE_AFTER_MS = 26 * 60 * 60 * 1000;

function isStale(iso: string): boolean {
  const age = Date.now() - new Date(iso).getTime();
  return Number.isFinite(age) && age > STALE_AFTER_MS;
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function BackupStatusCard({ status }: { status: BackupStatus | null }) {
  if (!status) {
    return (
      <div className="bg-gray-900 border border-gray-700/50 rounded-lg px-4 py-3 flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-gray-800/40 text-gray-400 border border-gray-600/40">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
          Unknown
        </span>
        <span className="text-gray-400 text-sm font-medium">MySQL Backup</span>
        <span className="text-gray-500 text-sm">no status yet</span>
      </div>
    );
  }

  const stale = isStale(status.timestamp);

  return (
    <div className="bg-gray-900 border border-gray-700/50 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {!status.success ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-red-900/40 text-red-300 border border-red-700/40">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Failed
          </span>
        ) : stale ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-amber-900/40 text-amber-300 border border-amber-700/40">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Stale
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-green-900/40 text-green-300 border border-green-700/40">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            OK
          </span>
        )}
        <span className="text-gray-100 font-medium text-sm">MySQL Backup</span>
        {status.error && (
          <span className="text-red-400 text-sm">{status.error}</span>
        )}
        {!status.error && stale && (
          <span className="text-amber-400 text-sm">no run in over 26h</span>
        )}
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-400">
        {status.sizeMb != null && <span>{status.sizeMb} MB</span>}
        <span className={stale ? 'text-amber-400' : undefined}>
          {formatRelative(status.timestamp)}
        </span>
      </div>
    </div>
  );
}
