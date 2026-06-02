import { NextResponse } from 'next/server';
import { getContainerInfo, getRecentErrors, getLastLogLines, getLastLogMessage, getLastExitInfo } from '@/lib/docker';
import { PROJECTS, INFRASTRUCTURE, ONE_SHOT } from '@/lib/projects';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const results = await Promise.allSettled([
    ...PROJECTS.map(async (project) => {
      const containers = await Promise.all(
        project.containers.map(name => getContainerInfo(name))
      );
      const errors = await Promise.all(
        project.containers.map(name => getRecentErrors(name))
      );
      const previews = await Promise.all(
        project.containers.map(name => getLastLogLines(name, 5))
      );
      const lastMessages = await Promise.all(
        project.containers.map(name => getLastLogMessage(name))
      );

      const oneShotForProject = ONE_SHOT.filter(s => s.showIn === project.name);
      const oneShotData = await Promise.all(
        oneShotForProject.map(async (s) => {
          const info = await getLastExitInfo(s.container);
          return { name: s.name, container: s.container, ...info };
        })
      );

      return {
        name: project.name,
        webUrl: project.webUrl,
        healthUrl: project.healthUrl,
        containers: project.containers.map((name, i) => ({
          name,
          info: containers[i],
          errorCount: errors[i].count,
          lastError: errors[i].lastError,
          logPreview: previews[i],
          lastMessage: lastMessages[i],
        })),
        oneShot: oneShotData,
      };
    }),
  ]);

  const infraResults = await Promise.all(
    INFRASTRUCTURE.map(async (svc) => ({
      name: svc.name,
      container: svc.container,
      info: await getContainerInfo(svc.container),
    }))
  );

  const projects = results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean);

  return NextResponse.json({ projects, infrastructure: infraResults });
}
