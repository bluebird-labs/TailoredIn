import { Elysia } from 'elysia';

export function configRoute(llmAvailable: boolean) {
  return new Elysia().get('/config', () => ({
    llmAvailable
  }));
}
