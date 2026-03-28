import { AiDI, type WebsiteColorsFinder } from '@tailoredin/ai';
import { command, positional, string } from 'cmd-ts';
import * as NpmLog from 'npmlog';
import { container } from '../../../../src/di/container.js';

const LOG_PREFIX = 'palette';
const websiteColorFinder = container.get<WebsiteColorsFinder>(AiDI.WebsiteColorsFinder);

export const palette = command({
  name: 'palette',
  args: {
    url: positional({ type: string })
  },
  handler: async args => {
    const colorPalette = await websiteColorFinder.findWebsitePalette({
      website: args.url
    });

    NpmLog.info(LOG_PREFIX, 'Palette:', colorPalette);
  }
});
