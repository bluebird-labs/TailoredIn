import { Logger as TsLogger } from 'tslog';
import { StringUtil } from './StringUtil.js';

// Exception: reads process.env.NODE_ENV directly because Environment imports Logger (circular dependency)
const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development';

export namespace Logger {
  export function create(owner: string | object) {
    const raw = typeof owner === 'string' ? owner : owner.constructor.name;
    const name = StringUtil.toKebabCase(raw);

    return new TsLogger({
      name,
      type: isDev ? 'pretty' : 'json',
      minLevel: isDev ? 0 : 3,
      prettyLogTimeZone: 'local'
    });
  }
}

export type { ILogObj } from 'tslog';
