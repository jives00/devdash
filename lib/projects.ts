export interface Project {
  name: string;
  containers: string[];
  healthUrl: string | null;
  webUrl: string | null;
}

export interface InfraService {
  name: string;
  container: string;
}

export interface OneShotService {
  name: string;
  container: string;
  showIn: string; // project name to attach this to
}

export const PROJECTS: Project[] = [
  {
    name: 'Quest',
    containers: ['quest-web', 'quest-api'],
    healthUrl: 'http://quest-api:3007/health',
    webUrl: 'http://synology:3006',
  },
  {
    name: 'Trakt',
    containers: ['trakt-web', 'trakt-api'],
    healthUrl: 'http://trakt-api:3002/health',
    webUrl: 'http://synology:3001/trakt',
  },
  {
    name: 'Pulse',
    containers: ['pulse-server', 'pulse-web'],
    healthUrl: 'http://pulse-server:3000/api/health',
    webUrl: 'http://synology:3004/pulse/',
  },
  { name: 'AlpacaBot',  containers: ['alpacabot'],  healthUrl: null, webUrl: null },
  { name: 'BigEastBot', containers: ['bigeastbot'],  healthUrl: null, webUrl: null },
  { name: 'BSNSFWBot',  containers: ['bsnsfwbot'],   healthUrl: null, webUrl: null },
];

export const INFRASTRUCTURE: InfraService[] = [
  { name: 'MySQL',      container: 'shared-mysql-1' },
  { name: 'Watchtower', container: 'shared-watchtower-1' },
  { name: 'Adminer',    container: 'shared-adminer-1' },
];

export const ONE_SHOT: OneShotService[] = [
  { name: 'Weight Sync', container: 'pulse-scripts', showIn: 'Pulse' },
];
