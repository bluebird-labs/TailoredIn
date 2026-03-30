#!/usr/bin/env bun

import { Logger } from '@tailoredin/core';
import { binary, run, subcommands } from 'cmd-ts';
import { jobsCommands } from './commands/jobs.js';
import { utilsCommands } from './commands/utils/utils.js';

const log = Logger.create('jobby');

const jobby = subcommands({
  name: 'jobby',
  description: 'CLI for the TailoredIn project.',
  cmds: {
    jobs: jobsCommands,
    utils: utilsCommands
  }
});

run(binary(jobby), process.argv)
  .then(() => {
    log.info('Done.');
    process.exit(0);
  })
  .catch(err => {
    log.error('Command crashed.', err);
    process.exit(1);
  });
