import 'reflect-metadata';
import 'dotenv/config';
import { TimeUtil } from '@tailoredin/core';
import { Logger } from '@tailoredin/core/src/Logger.js';
import { DI } from '@tailoredin/infrastructure';
import { milliseconds } from 'date-fns';
import config from './config.js';
import { container, orm } from './container.js';

const log = Logger.create('TailoredIn');

const searchAll = async () => {
  const useCase = container.get(DI.Job.ScrapeAndIngestJobs);
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
        log.error('Search round failed', err);
      }

      log.info(`Search round is over, entering 15-30 minutes break. Now is ${new Date()}`);

      await TimeUtil.waitRandom(milliseconds({ minutes: 15 }), milliseconds({ minutes: 30 }));
    }
  })
  .catch(async err => {
    log.error('Robot crashed', err);
    await orm.close(true);
    process.exit(1);
  });
