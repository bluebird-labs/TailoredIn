import 'dotenv/config';
import { type MikroORM, RequestContext } from '@mikro-orm/postgresql';
import { JobStatus } from '@tailoredin/db';
import {
  type JobSearchHandler,
  LinkedInDI,
  type LinkedInExplorer,
  type LinkedInSearchJobsCommandParams
} from '@tailoredin/linkedin';
import { InspectUtil, TimeUtil } from '@tailoredin/shared';
import { milliseconds } from 'date-fns';
import { omit, pick } from 'lodash';
import * as NpmLog from 'npmlog';
import { RobotDI, type IJobElector } from '@tailoredin/robot';
import config from './config.js';
import { container } from './container.js';

const LOG_PREFIX = 'TailoredIn';
const orm = container.get<MikroORM>(LinkedInDI.Orm);
const jobSearchHandler = container.get<JobSearchHandler>(LinkedInDI.JobSearchHandler);
const jobElector = container.get<IJobElector>(RobotDI.JobElector);
const linkedinExplorer = container.get<LinkedInExplorer>(LinkedInDI.LinkedInExplorer);

const searchParams = async (params: Omit<LinkedInSearchJobsCommandParams, 'maxPages' | 'past'>) => {
  await RequestContext.create(orm.em, async () => {
    await linkedinExplorer.searchJobs(
      {
        ...params,
        maxPages: 1,
        past: 'day'
      },
      async (jobSearchResult, parseApplicationDetails) => {
        const { job, company } = await jobSearchHandler.ingestJobSearchResult(jobSearchResult);
        const electedJobStatus = await jobElector.elect(job, company);

        if (electedJobStatus === JobStatus.NEW) {
          const { applyLink, companyWebsite } = await parseApplicationDetails();

          if (companyWebsite !== null) {
            company.setWebsite(companyWebsite);
            orm.em.persist(company);
          }

          if (applyLink !== null) {
            job.setApplyLink(applyLink);
            orm.em.persist(job);
          }
        } else {
          job.changeStatus(electedJobStatus);
          orm.em.persist(job);
        }

        await orm.em.flush();

        const meta = {
          job: pick(job, [
            'id',
            'title',
            'status',
            'applyLink',
            'salaryHigh',
            'salaryLow',
            'remote',
            'applicantsCount',
            'locationRaw'
          ]),
          company: pick(company, ['id', 'name', 'website', 'ignored'])
        };

        if (job.status === JobStatus.NEW) {
          NpmLog.info(LOG_PREFIX, `Job added`);
        } else {
          NpmLog.warn(LOG_PREFIX, `Job rejected`);
        }

        InspectUtil.inspect(meta, {
          colors: true,
          compact: true,
          showHidden: false
        });
      }
    );
  });
};

const searchAll = async () => {
  for (const [configSearchName, configSearchParams] of Object.entries(config.searches)) {
    NpmLog.notice(LOG_PREFIX, `Searching for ${configSearchName}...`);
    await searchParams(omit(configSearchParams, 'maxPages', 'past'));
    NpmLog.notice(LOG_PREFIX, `Done searching for ${configSearchName}.`);
  }
};

Promise.resolve()
  .then(async () => {
    // noinspection InfiniteLoopJS
    while (true) {
      await linkedinExplorer.connect();

      try {
        await searchAll();
      } finally {
        await linkedinExplorer.close();
      }

      NpmLog.notice(LOG_PREFIX, `Search round is over, entering 15-30 minutes break. Now is ${new Date()}`);

      await TimeUtil.waitRandom(milliseconds({ minutes: 15 }), milliseconds({ minutes: 30 }));
    }
  })
  .catch(async err => {
    NpmLog.error(LOG_PREFIX, 'Job finder crashed', err);
    await linkedinExplorer.close();
    await orm.close(true);
    process.exit(1);
  });
