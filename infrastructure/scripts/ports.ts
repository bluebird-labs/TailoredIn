function portOffset(branchName: string): number {
  if (branchName === 'main' || branchName === 'master') return 0;
  let hash = 0;
  for (const ch of branchName) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  return (Math.abs(hash) % 999) + 1;
}

export function portsForBranch(branchName: string) {
  const offset = portOffset(branchName);
  return {
    dbPort: 5432 + offset,
    apiPort: 8000 + offset,
    webPort: 5173 + offset
  };
}

export function projectName(branchName: string): string {
  const slug = branchName.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  return `tailoredin-${slug}`;
}
