import { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import { TestContext }             from 'node:test';

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
