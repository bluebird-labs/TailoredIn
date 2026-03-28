import type { TestContext } from 'node:test';
import type { EntityManager, MikroORM } from '@mikro-orm/postgresql';

type OrmTestFn = (t: TestContext, em: EntityManager) => Promise<void>;

export namespace TestUtil {
  export const withOrm = (orm: MikroORM, fn: OrmTestFn) => {
    return async (t: TestContext) => {
      const em = orm.em.fork();
      await em.begin();

      try {
        await fn(t, em);
      } finally {
        await em.rollback();
      }
    };
  };
}
