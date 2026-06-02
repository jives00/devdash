'use client';

type Status = 'running' | 'stopped' | 'restarting' | 'unknown';

export function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { label: string; className: string; dot: string }> = {
    running:    { label: 'Running',    className: 'bg-green-900/40 text-green-300 border border-green-700/40',   dot: 'bg-green-400' },
    stopped:    { label: 'Stopped',    className: 'bg-red-900/40 text-red-300 border border-red-700/40',         dot: 'bg-red-400' },
    restarting: { label: 'Restarting', className: 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/40', dot: 'bg-yellow-400 animate-pulse' },
    unknown:    { label: 'Unknown',    className: 'bg-gray-800/40 text-gray-400 border border-gray-600/40',      dot: 'bg-gray-500' },
  };
  const { label, className, dot } = map[status] ?? map.unknown;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
