'use client';

import { StatusBadge } from './StatusBadge';

interface InfraData {
  name: string;
  container: string;
  info: { status: string; uptime: string; restartCount: number } | null;
}

export function InfraCard({ svc }: { svc: InfraData }) {
  return (
    <div className="bg-gray-900 border border-gray-700/50 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <StatusBadge status={(svc.info?.status ?? 'unknown') as any} />
        <span className="text-gray-100 font-medium text-sm">{svc.name}</span>
        <span className="text-gray-400 font-mono text-sm">{svc.container}</span>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-400">
        {svc.info?.uptime && <span>up {svc.info.uptime}</span>}
        {svc.info && svc.info.restartCount > 0 && (
          <span className="text-yellow-400">{svc.info.restartCount} restarts</span>
        )}
      </div>
    </div>
  );
}
