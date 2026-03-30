import { EnumUtil } from '@tailoredin/core';
import { Logger } from '@tailoredin/core/src/Logger.js';
import { JobStatus } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { command, number, positional, string, subcommands } from 'cmd-ts';
import { container } from '../di/container.js';

const log = Logger.create('jobs');

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

    const useCase = container.get(DI.Job.ChangeJobStatus);
    const result = await useCase.execute({ jobId: args.job_id, newStatus: args.status });

    if (!result.isOk) {
      log.error(result.error.message);
      return;
    }

    log.info(`Job ${args.job_id} was updated to ${args.status}`);
  }
});

export const retireCommand = command({
  name: 'retire',
  args: {
    days: positional({ type: number })
  },
  handler: async args => {
    log.info(`Retiring jobs older than ${args.days} days...`);

    const jobRepository = container.get(DI.Job.Repository);
    const olderThan = new Date(Date.now() - args.days * 24 * 60 * 60 * 1000);
    const count = await jobRepository.retireOlderThan(olderThan);

    log.info(`Retired ${count} jobs.`);
  }
});

export const jobsCommands = subcommands({
  name: 'jobs',
  cmds: { move: moveCommand, retire: retireCommand }
});
