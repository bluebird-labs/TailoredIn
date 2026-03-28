import { command, number, positional, string, subcommands } from 'cmd-ts';
import { EnumUtil }                                         from '@tailoredin/shared';
import { Job, JobStatus }                                   from '@tailoredin/db';
import { container }                                        from '../../src/di/container.js';
import { ApiDI }                                            from '../../src/di/DI.js';
import { MikroORM }                                         from '@mikro-orm/postgresql';
import * as NpmLog                                          from 'npmlog';

const LOG_PREFIX = 'jobs';
const orm = container.get<MikroORM>(ApiDI.Orm);

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

    const job = await orm.em.getRepository(Job).findOneOrFail(args.job_id);

    const changed = job.changeStatus(args.status);

    if (!changed) {
      NpmLog.warn(LOG_PREFIX, `Job ${args.job_id} is already in status ${args.status}`);
      return;
    }

    await orm.em.persistAndFlush(job);

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

    const count = await orm.em.getRepository(Job).retireOlderThan({
      days: args.days
    });

    NpmLog.info(LOG_PREFIX, `Retired ${count} jobs.`);
  }
});

export const jobsCommands = subcommands({
  name: 'jobs',
  cmds: { move: moveCommand, retire: retireCommand }
});
