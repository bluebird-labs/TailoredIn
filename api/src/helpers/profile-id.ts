import type { MikroORM } from '@mikro-orm/postgresql';

export async function getProfileId(orm: MikroORM): Promise<string> {
  const result = await orm.em.getConnection().execute<[{ id: string }]>('SELECT id FROM profiles LIMIT 1');
  if (!result.length) throw new Error('No profile found. Run seeds first.');
  return result[0].id;
}
