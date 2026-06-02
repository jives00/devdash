'use client';

import Link from 'next/link';
import { LogViewer } from '@/components/LogViewer';
import { use } from 'react';

export default function LogPage({ params }: { params: Promise<{ container: string }> }) {
  const { container } = use(params);

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="flex-1 flex flex-col max-w-full px-6 py-6 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm">← Back</Link>
          <h1 className="text-white font-bold text-lg font-mono">{container}</h1>
          <span className="text-gray-600 text-xs">live log viewer</span>
        </div>
        <div className="flex-1 min-h-0" style={{ height: 'calc(100vh - 100px)' }}>
          <LogViewer containerName={container} />
        </div>
      </div>
    </main>
  );
}
