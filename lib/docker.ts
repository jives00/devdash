import Dockerode from 'dockerode';

let _docker: Dockerode | null = null;

export function getDocker(): Dockerode {
  if (!_docker) {
    _docker = new Dockerode({ socketPath: '/var/run/docker.sock' });
  }
  return _docker;
}

export interface ContainerInfo {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'restarting' | 'unknown';
  state: string;
  uptime: string;
  restartCount: number;
}

export async function getContainerInfo(name: string): Promise<ContainerInfo | null> {
  try {
    const docker = getDocker();
    const containers = await docker.listContainers({ all: true, filters: JSON.stringify({ name: [name] }) });
    const match = containers.find(c => c.Names.some(n => n === `/${name}` || n === name));
    if (!match) return null;

    const container = docker.getContainer(match.Id);
    const inspect = await container.inspect();
    const state = inspect.State;

    let status: ContainerInfo['status'] = 'unknown';
    if (state.Running) status = 'running';
    else if (state.Restarting) status = 'restarting';
    else status = 'stopped';

    let uptime = '';
    if (state.Running && state.StartedAt) {
      const started = new Date(state.StartedAt);
      const ms = Date.now() - started.getTime();
      uptime = formatDuration(ms);
    }

    return {
      id: match.Id,
      name,
      status,
      state: state.Status,
      uptime,
      restartCount: inspect.RestartCount ?? 0,
    };
  } catch {
    return null;
  }
}

export async function getRecentErrors(name: string): Promise<{ count: number; lastError: string | null }> {
  try {
    const docker = getDocker();
    const containers = await docker.listContainers({ all: true, filters: JSON.stringify({ name: [name] }) });
    const match = containers.find(c => c.Names.some(n => n === `/${name}` || n === name));
    if (!match) return { count: 0, lastError: null };

    const container = docker.getContainer(match.Id);
    const inspect = await container.inspect();
    const sixHoursAgo = Math.floor((Date.now() - 6 * 60 * 60 * 1000) / 1000);
    const startedAt = inspect.State.StartedAt
      ? Math.floor(new Date(inspect.State.StartedAt).getTime() / 1000)
      : 0;
    // Use the more recent of the two — errors before the current session or older than 6h aren't actionable
    const since = Math.max(startedAt, sixHoursAgo);
    const stream = await container.logs({ stdout: true, stderr: true, tail: 200, follow: false, since }) as Buffer;
    const raw = stream.toString('utf8');
    const lines = raw.split('\n').map(l => stripDockerHeader(l)).filter(Boolean);

    const errorLines = lines.filter(l => /error|exception|traceback|critical/i.test(l));
    return {
      count: errorLines.length,
      lastError: errorLines.length > 0 ? errorLines[errorLines.length - 1].slice(0, 200) : null,
    };
  } catch {
    return { count: 0, lastError: null };
  }
}

export async function getLastLogLines(name: string, n = 5): Promise<string[]> {
  try {
    const docker = getDocker();
    const containers = await docker.listContainers({ all: true, filters: JSON.stringify({ name: [name] }) });
    const match = containers.find(c => c.Names.some(n => n === `/${name}` || n === name));
    if (!match) return [];

    const container = docker.getContainer(match.Id);
    const stream = await container.logs({ stdout: true, stderr: true, tail: n, follow: false }) as Buffer;
    return stream.toString('utf8').split('\n').map(l => stripDockerHeader(l)).filter(Boolean);
  } catch {
    return [];
  }
}

export async function getLastLogMessage(name: string): Promise<string | null> {
  const lines = await getLastLogLines(name, 10);
  return lines.length > 0 ? lines[lines.length - 1] : null;
}

export async function getLastExitInfo(name: string): Promise<{ exitCode: number | null; finishedAt: string | null } | null> {
  try {
    const docker = getDocker();
    const containers = await docker.listContainers({ all: true, filters: JSON.stringify({ name: [name] }) });
    const match = containers.find(c => c.Names.some(n => n === `/${name}` || n === name));
    if (!match) return null;
    const inspect = await docker.getContainer(match.Id).inspect();
    return {
      exitCode: inspect.State.ExitCode ?? null,
      finishedAt: inspect.State.FinishedAt ?? null,
    };
  } catch {
    return null;
  }
}

// Docker log lines have an 8-byte multiplexing header — strip it
export function stripDockerHeader(line: string): string {
  if (line.length >= 8) {
    const first = line.charCodeAt(0);
    if (first === 1 || first === 2) return line.slice(8);
  }
  return line;
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}
