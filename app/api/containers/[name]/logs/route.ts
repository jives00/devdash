import { getDocker, stripDockerHeader } from '@/lib/docker';

export const dynamic = 'force-dynamic';

const SINCE_SECONDS: Record<string, number> = { '2h': 7200, '6h': 21600, '24h': 86400 };

export async function GET(
  req: Request,
  { params }: { params: { name: string } }
) {
  const { name } = params;
  const url = new URL(req.url);
  const sinceKey = url.searchParams.get('since') ?? '2h';
  const since = Math.floor(Date.now() / 1000) - (SINCE_SECONDS[sinceKey] ?? SINCE_SECONDS['2h']);

  const docker = getDocker();
  const containers = await docker.listContainers({ all: true, filters: JSON.stringify({ name: [name] }) });
  const match = containers.find(c => c.Names.some(n => n === `/${name}` || n === name));

  if (!match) {
    return new Response('Container not found', { status: 404 });
  }

  const container = docker.getContainer(match.Id);

  const encoder = new TextEncoder();
  let streamRef: NodeJS.ReadableStream | null = null;

  const readable = new ReadableStream({
    async start(ctrl) {
      try {
        const stream = await container.logs({
          follow: true,
          stdout: true,
          stderr: true,
          since,
          timestamps: false,
        }) as NodeJS.ReadableStream;

        streamRef = stream;

        stream.on('data', (chunk: Buffer) => {
          const text = chunk.toString('utf8');
          const lines = text.split('\n');
          for (const line of lines) {
            const clean = stripDockerHeader(line);
            if (clean.trim()) {
              // Detect stderr: original byte[0] === 2
              const isErr = chunk[0] === 2;
              ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ log: clean, err: isErr })}\n\n`));
            }
          }
        });

        stream.on('end', () => ctrl.close());
        stream.on('error', () => ctrl.close());
      } catch {
        ctrl.close();
      }
    },
    cancel() {
      if (streamRef) {
        (streamRef as any).destroy?.();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
