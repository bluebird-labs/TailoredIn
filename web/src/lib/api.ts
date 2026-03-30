import { treaty } from '@elysiajs/eden';
import type { App } from '@tailoredin/api/client';

export const api = treaty<App>(`${window.location.origin}/api`);
