import type { WebColorService } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { command, positional, string } from 'cmd-ts';
import * as NpmLog from 'npmlog';
import { container } from '../../../di/container.js';

const LOG_PREFIX = 'palette';
const webColorService = container.get(DI.WebColorService) as WebColorService;

export const palette = command({
  name: 'palette',
  args: {
    url: positional({ type: string })
  },
  handler: async args => {
    const colorPalette = await webColorService.findPalette(args.url);
    NpmLog.info(LOG_PREFIX, 'Palette:', colorPalette);
  }
});
