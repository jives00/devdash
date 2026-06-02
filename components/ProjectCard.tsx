'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatusBadge } from './StatusBadge';

interface ContainerData {
  name: string;
  info: { status: string; uptime: string; restartCount: number } | null;
  errorCount: number;
  lastError: string | null;
  logPreview: string[];
  lastMessage: string | null;
}

interface OneShotData {
  name: string;
  container: string;
  exitCode: number | null;
  finishedAt: string | null;
}

interface ProjectData {
  name: string;
  webUrl: string | null;
  healthUrl: string | null;
  containers: ContainerData[];
  oneShot: OneShotData[];
}

interface HealthResult {
  ok: boolean;
  latencyMs: number;
  db?: string;
  error?: string;
}

export function ProjectCard({ project }: { project: ProjectData }) {
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!project.healthUrl) return;
    const fetch_health = () =>
      fetch(`/api/health/${encodeURIComponent(project.name)}`)
        .then(r => r.json())
        .then(setHealth)
        .catch(() => setHealth({ ok: false, latencyMs: 0, error: 'fetch failed' }));
    fetch_health();
    const id = setInterval(fetch_health, 30_000);
    return () => clearInterval(id);
  }, [project.name, project.healthUrl]);

  const totalErrors = project.containers.reduce((s, c) => s + c.errorCount, 0);
  const allRunning = project.containers.every(c => c.info?.status === 'running');
  const anyRestarting = project.containers.some(c => c.info?.status === 'restarting');
  const overallStatus = anyRestarting ? 'restarting' : allRunning ? 'running' : 'stopped';

  return (
    <div className="bg-gray-900 border border-gray-700/50 rounded-xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <StatusBadge status={overallStatus as any} />
          <h2 className="text-white font-bold text-lg">{project.name}</h2>
          {totalErrors > 0 && (
            <span className="bg-red-900/60 text-red-300 border border-red-700/40 text-xs font-bold px-2 py-0.5 rounded-full">
              {totalErrors} error{totalErrors !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {project.webUrl && (
            <a href={project.webUrl} target="_blank" rel="noopener noreferrer"
               className="text-xs text-blue-400 hover:text-blue-300 underline">
              Open →
            </a>
          )}
        </div>
      </div>

      {/* Health check */}
      {project.healthUrl && health && (
        <div className={`text-xs flex items-center gap-2 ${health.ok ? 'text-green-400' : 'text-red-400'}`}>
          <span>{health.ok ? '✓ Healthy' : '✗ Unhealthy'}</span>
          {health.latencyMs > 0 && <span className="text-gray-500">{health.latencyMs}ms</span>}
          {health.db && <span className="text-gray-500">DB: {health.db}</span>}
          {health.error && <span className="text-red-400 truncate max-w-xs">{health.error}</span>}
        </div>
      )}

      {/* Container list */}
      <div className="flex flex-col gap-2">
        {project.containers.map(c => (
          <div key={c.name} className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <StatusBadge status={(c.info?.status ?? 'unknown') as any} />
              <span className="text-gray-300 font-mono text-xs truncate">{c.name}</span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {c.info?.uptime && <span className="text-gray-500 text-xs">up {c.info.uptime}</span>}
              {(c.info?.restartCount ?? 0) > 0 && (
                <span className="text-yellow-500 text-xs">{c.info!.restartCount} restart{c.info!.restartCount !== 1 ? 's' : ''}</span>
              )}
              <Link href={`/logs/${c.name}`} className="text-xs text-blue-400 hover:text-blue-300">
                Logs
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* One-shot services */}
      {project.oneShot.map(s => (
        <div key={s.container} className="text-xs text-gray-500 flex items-center gap-2">
          <span>{s.name}:</span>
          {s.finishedAt && s.finishedAt !== '0001-01-01T00:00:00Z' ? (
            <>
              <span className={s.exitCode === 0 ? 'text-green-400' : 'text-red-400'}>
                {s.exitCode === 0 ? 'OK' : `exit ${s.exitCode}`}
              </span>
              <span>{formatRelative(s.finishedAt)}</span>
              <Link href={`/logs/${s.container}`} className="text-blue-400 hover:text-blue-300">Logs</Link>
            </>
          ) : (
            <span>never run</span>
          )}
        </div>
      ))}

      {/* Last error */}
      {totalErrors > 0 && project.containers.map(c => c.lastError).filter(Boolean).slice(0, 1).map((err, i) => (
        <div key={i} className="bg-red-950/40 border border-red-800/30 rounded p-2">
          <p className="text-xs text-red-300 font-mono truncate">{err}</p>
        </div>
      ))}

      {/* Log preview */}
      <div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-xs text-gray-500 hover:text-gray-300 mb-1"
        >
          {expanded ? '▲ Hide logs' : '▼ Show recent logs'}
        </button>
        {expanded && project.containers.slice(0, 1).map(c => (
          <div key={c.name} className="bg-black/40 rounded p-2 font-mono text-xs text-gray-400 space-y-0.5 max-h-32 overflow-y-auto">
            {c.logPreview.length > 0
              ? c.logPreview.map((line, i) => <div key={i} className="truncate">{line}</div>)
              : <div className="text-gray-600">No recent logs</div>
            }
          </div>
        ))}
      </div>

      {/* Bot last active */}
      {!project.healthUrl && project.containers.map(c => c.lastMessage).filter(Boolean).slice(0, 1).map((msg, i) => (
        <div key={i} className="text-xs text-gray-600 font-mono truncate" title={msg ?? ''}>
          Last: {msg}
        </div>
      ))}
    </div>
  );
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
