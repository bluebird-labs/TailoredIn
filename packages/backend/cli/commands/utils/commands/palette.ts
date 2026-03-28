import { command, positional, string } from 'cmd-ts';
import { container } from '../../../../src/di/container';
import { WebsiteColorsFinder } from '../../../../src/services/WebsiteColorsFinder';
import { DI } from '../../../../src/di/DI';
import * as NpmLog from 'npmlog';

const LOG_PREFIX = 'palette';
const websiteColorFinder = container.get<WebsiteColorsFinder>(DI.WebsiteColorsFinder);

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
