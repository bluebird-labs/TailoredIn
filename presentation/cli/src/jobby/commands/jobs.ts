import type { ChangeJobStatus } from '@tailoredin/application';
import { JobStatus } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { EnumUtil } from '@tailoredin/shared';
import { command, number, positional, string, subcommands } from 'cmd-ts';
import * as NpmLog from 'npmlog';
import { container } from '../di/container.js';

const LOG_PREFIX = 'jobs';

const moveCommand = command({
  name: 'move',
  args: {
    job_id: positional({ type: string, displayName: 'Job ID', description: 'The job to move' }),
    status: positional({ type: string, displayName: 'Status', description: 'The status to move the job into' })
  },
  handler: async args => {
    if (!EnumUtil.is(args.status, JobStatus)) {
      throw new Error(`Invalid job status: ${args.status}, choices: ${Object.values(JobStatus)}`);
    }

    const useCase = container.get(DI.ChangeJobStatus) as ChangeJobStatus;
    const result = await useCase.execute({ jobId: args.job_id, newStatus: args.status });

    if (!result.isOk) {
      NpmLog.error(LOG_PREFIX, result.error.message);
      return;
    }

    NpmLog.info(LOG_PREFIX, `Job ${args.job_id} was updated to ${args.status}`);
  }
});

export const retireCommand = command({
  name: 'retire',
  args: {
    days: positional({ type: number })
  },
  handler: async args => {
    NpmLog.info(LOG_PREFIX, `Retiring jobs older than ${args.days} days...`);

    const jobRepository = container.get(DI.JobRepository);
    const olderThan = new Date(Date.now() - args.days * 24 * 60 * 60 * 1000);
    const count = await jobRepository.retireOlderThan(olderThan);

    NpmLog.info(LOG_PREFIX, `Retired ${count} jobs.`);
  }
});

export const jobsCommands = subcommands({
  name: 'jobs',
  cmds: { move: moveCommand, retire: retireCommand }
});
