import { NextResponse } from 'next/server';
import { PROJECTS } from '@/lib/projects';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { service: string } }
) {
  const project = PROJECTS.find(p => p.name.toLowerCase() === params.service.toLowerCase());
  if (!project?.healthUrl) {
    return NextResponse.json({ ok: false, error: 'No health URL configured' }, { status: 404 });
  }

  const start = Date.now();
  try {
    const res = await fetch(project.healthUrl, { signal: AbortSignal.timeout(5000) });
    const latencyMs = Date.now() - start;
    const body = await res.json().catch(() => ({}));
    return NextResponse.json({ ok: res.ok, latencyMs, ...body });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'unreachable',
    });
  }
}
