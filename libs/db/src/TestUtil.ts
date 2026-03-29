import type { EntityManager, MikroORM } from '@mikro-orm/postgresql';

type OrmTestFn = (em: EntityManager) => Promise<void>;

export namespace TestUtil {
  export const withOrm = (orm: MikroORM, fn: OrmTestFn) => {
    return async () => {
      const em = orm.em.fork();
      await em.begin();

      try {
        await fn(em);
      } finally {
        await em.rollback();
      }
    };
  };
}
