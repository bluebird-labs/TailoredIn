import { Logger as TsLogger } from 'tslog';

const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development';

export const Logger = {
  create(name: string) {
    return new TsLogger({
      name,
      type: isDev ? 'pretty' : 'json',
      minLevel: isDev ? 0 : 3,
      prettyLogTimeZone: 'local'
    });
  }
};

export type { ILogObj } from 'tslog';
