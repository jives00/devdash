'use client';

import { useEffect, useState, useCallback } from 'react';
import { ProjectCard } from '@/components/ProjectCard';
import { InfraCard } from '@/components/InfraCard';

interface DashboardData {
  projects: any[];
  infrastructure: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(() => {
    fetch('/api/containers')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLastUpdated(new Date());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10_000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight">DevDash</h1>
            <p className="text-gray-500 text-sm mt-0.5">NAS Services Monitor</p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-gray-600">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={refresh}
              className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded px-3 py-1.5 text-gray-400"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading && <div className="text-gray-600 text-sm">Loading...</div>}

        {data && (
          <>
            <section className="mb-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-4">Applications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {data.projects.map((project: any) => (
                  <ProjectCard key={project.name} project={project} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-4">Infrastructure</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {data.infrastructure.map((svc: any) => (
                  <InfraCard key={svc.name} svc={svc} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
