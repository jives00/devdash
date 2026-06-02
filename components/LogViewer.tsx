'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface LogLine {
  text: string;
  err: boolean;
  ts: number;
}

type Since = '2h' | '6h' | '24h';

export function LogViewer({ containerName }: { containerName: string }) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [filter, setFilter] = useState('');
  const [paused, setPaused] = useState(false);
  const [since, setSince] = useState<Since>('2h');
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  const connect = useCallback((s: Since) => {
    esRef.current?.close();
    setLines([]);
    setConnected(false);

    const es = new EventSource(`/api/containers/${encodeURIComponent(containerName)}/logs?since=${s}`);
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onmessage = (e) => {
      try {
        const { log, err } = JSON.parse(e.data);
        setLines(prev => [...prev.slice(-2000), { text: log, err: !!err, ts: Date.now() }]);
      } catch {}
    };
    es.onerror = () => {
      setConnected(false);
      es.close();
    };
  }, [containerName]);

  useEffect(() => {
    connect(since);
    return () => esRef.current?.close();
  }, [connect, since]);

  useEffect(() => {
    if (!paused) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lines, paused]);

  const displayed = filter
    ? lines.filter(l => l.text.toLowerCase().includes(filter.toLowerCase()))
    : lines;

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded overflow-hidden border border-gray-600 text-sm">
          {(['2h', '6h', '24h'] as Since[]).map(s => (
            <button
              key={s}
              onClick={() => setSince(s)}
              className={`px-3 py-1.5 ${since === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              Last {s}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Filter logs..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 w-48 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={() => setPaused(v => !v)}
          className={`text-sm px-3 py-1.5 rounded border ${paused ? 'border-yellow-500 text-yellow-300 bg-yellow-900/20' : 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700'}`}
        >
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} title={connected ? 'Connected' : 'Disconnected'} />
        <span className="text-sm text-gray-400">{displayed.length} lines</span>
        {filter && <span className="text-sm text-blue-400">filtered from {lines.length}</span>}
      </div>

      {/* Log output */}
      <div className="flex-1 bg-black rounded-lg p-3 overflow-y-auto font-mono text-sm min-h-0">
        {displayed.map((line, i) => (
          <div
            key={i}
            className={`leading-5 whitespace-pre-wrap break-all ${line.err ? 'text-red-400' : 'text-gray-200'}`}
          >
            {line.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
