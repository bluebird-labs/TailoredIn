import { Environment } from '../Environment';
import Path from 'node:path';
import { ORM_DIR } from './ORM_DIR';
import FS from 'node:fs';

const configFilePath = Path.resolve(ORM_DIR, `pg-typed.config.json`);

const config = {
  transforms: [
    {
      mode: 'sql',
      include: '**/*.pgsql',
      emitTemplate: '{{dir}}/{{name}}.sql.ts'
    }
  ],
  srcDir: Path.resolve(ORM_DIR, 'entities'),

  failOnError: true,
  camelCaseColumnNames: false,
  db: {
    host: Environment.get('POSTGRES_HOST'),
    user: Environment.get('POSTGRES_USER'),
    dbName: Environment.get('POSTGRES_DB'),
    schema: Environment.get('POSTGRES_SCHEMA'),
    password: Environment.get('POSTGRES_PASSWORD')
  }
};

FS.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
