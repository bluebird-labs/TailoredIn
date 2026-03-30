import NodeUtil from 'node:util';
import { Logger } from './Logger.js';

const log = Logger.create('InspectUtil');

export namespace InspectUtil {
  // biome-ignore lint/suspicious/noExplicitAny: wraps util.inspect which genuinely accepts any value
  export const inspect = (data: any, options: Parameters<typeof NodeUtil.inspect>[1] = {}): void => {
    log.info(
      NodeUtil.inspect(data, {
        depth: null,
        colors: true,
        compact: true,
        showHidden: false,
        ...options
      })
    );
  };
}
