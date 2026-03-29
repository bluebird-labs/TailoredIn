import { ApplicationResumeDI } from '@tailoredin/application-resume';
import type { WebColorService } from '@tailoredin/application-resume';
import { command, positional, string } from 'cmd-ts';
import * as NpmLog from 'npmlog';
import { container } from '../../../di/container.js';

const LOG_PREFIX = 'palette';
const webColorService = container.get(ApplicationResumeDI.WebColorService) as WebColorService;

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
