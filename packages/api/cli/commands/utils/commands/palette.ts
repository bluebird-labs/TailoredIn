import { command, positional, string } from 'cmd-ts';
import { container }                   from '../../../../src/di/container.js';
import { AiDI, WebsiteColorsFinder }   from '@tailoredin/ai';
import * as NpmLog                     from 'npmlog';

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
