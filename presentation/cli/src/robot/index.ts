import 'reflect-metadata';
import 'dotenv/config';
import type { ScrapeAndIngestJobs } from '@tailoredin/application';
import { TimeUtil } from '@tailoredin/core';
import { DI } from '@tailoredin/infrastructure';
import { milliseconds } from 'date-fns';
import * as NpmLog from 'npmlog';
import config from './config.js';
import { container, orm } from './container.js';

const LOG_PREFIX = 'TailoredIn';

const searchAll = async () => {
  const useCase = container.get(DI.ScrapeAndIngestJobs) as ScrapeAndIngestJobs;
  const searches = Object.entries(config.searches);
  const activeSearches = config.only ? searches.filter(([name]) => config.only?.includes(name)) : searches;

  await useCase.execute(activeSearches.map(([, params]) => params));
};

Promise.resolve()
  .then(async () => {
    // noinspection InfiniteLoopJS
    while (true) {
      try {
        await searchAll();
      } catch (err) {
        NpmLog.error(LOG_PREFIX, 'Search round failed', err);
      }

      NpmLog.notice(LOG_PREFIX, `Search round is over, entering 15-30 minutes break. Now is ${new Date()}`);

      await TimeUtil.waitRandom(milliseconds({ minutes: 15 }), milliseconds({ minutes: 30 }));
    }
  })
  .catch(async err => {
    NpmLog.error(LOG_PREFIX, 'Robot crashed', err);
    await orm.close(true);
    process.exit(1);
  });
