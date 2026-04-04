import { Elysia } from 'elysia';

export function configRoute() {
  return new Elysia().get('/config', () => ({}));
}
