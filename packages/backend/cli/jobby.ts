#!/usr/bin/env node_modules/.bin/tsx

import { binary, run, subcommands } from 'cmd-ts';
import { jobsCommands } from './commands/jobs';
import { utilsCommands } from './commands/utils/utils';
import * as NpmLog from 'npmlog';

const LOG_PREFIX = 'jobby';

const jobby = subcommands({
  name: 'jobby',
  description: 'CLI for the JobFinder project.',
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
