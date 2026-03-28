#!/usr/bin/env bun

import 'dotenv/config';
import { binary, run, subcommands } from 'cmd-ts';
import * as NpmLog from 'npmlog';
import { jobsCommands } from './commands/jobs.js';
import { utilsCommands } from './commands/utils/utils.js';

const LOG_PREFIX = 'jobby';

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
    NpmLog.info(LOG_PREFIX, 'Done.');
    process.exit(0);
  })
  .catch(err => {
    NpmLog.error(LOG_PREFIX, 'Command crashed.', err);
    process.exit(1);
  });
