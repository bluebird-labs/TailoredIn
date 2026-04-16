import { treaty } from '@elysiajs/eden';
import type { App } from '@tailoredin/api/client';
import { getToken } from './auth.js';

export const api = treaty<App>(`${window.location.origin}/api`, {
  headers() {
    const token = getToken();
    return token ? { authorization: `Bearer ${token}` } : {};
  }
});
