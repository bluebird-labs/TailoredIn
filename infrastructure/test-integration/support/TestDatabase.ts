import { MikroORM } from '@mikro-orm/postgresql';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { createOrmConfig } from '../../src/db/orm-config.js';

const state: { container: StartedTestContainer | null; orm: MikroORM | null } = {
  container: null,
  orm: null
};

export async function setupTestDatabase(): Promise<MikroORM> {
  state.container = await new GenericContainer('postgres:17-alpine')
    .withEnvironment({
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'test',
      POSTGRES_DB: 'test'
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage(/ready to accept connections/, 2))
    .start();

  const config = createOrmConfig({
    timezone: 'UTC',
    user: 'test',
    password: 'test',
    dbName: 'test',
    schema: 'public',
    host: state.container.getHost(),
    port: state.container.getMappedPort(5432)
  });

  state.orm = await MikroORM.init(config);
  await state.orm.migrator.up();

  return state.orm;
}

export async function teardownTestDatabase(): Promise<void> {
  if (state.orm) {
    await state.orm.close(true);
    state.orm = null;
  }
  if (state.container) {
    await state.container.stop();
    state.container = null;
  }
}
