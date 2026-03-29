import 'dotenv/config';
import { after, describe, it, type TestContext } from 'node:test';
import { MikroORM } from '@mikro-orm/postgresql';
import { TestUtil } from '@tailoredin/db';
import { makeOrmConfig } from '../../makeOrmConfig.js';
import { Company } from '../companies/Company.js';
import { Job } from './Job.js';
import { TransientJob } from './TransientJob.js';

import withOrm = TestUtil.withOrm;

describe('JobRepository', () => {
  const orm = new MikroORM(makeOrmConfig());

  describe('resolve', () => {
    it(
      'should create a new job',
      withOrm(orm, async (t: TestContext, em) => {
        const company = Company.generate();

        em.persist(company);
        await em.flush();
        em.clear();

        const transientJob = TransientJob.generate();
        const job = await em.repo(Job).resolve(transientJob, company, { em });

        t.assert.ok(typeof job.id === 'string', 'Job ID should be a string');
        t.assert.equal(job.title, transientJob.title);
      })
    );

    it(
      'should update an existing job',
      withOrm(orm, async (t: TestContext, em) => {
        const company = Company.generate();

        em.persist(company);
        await em.flush();

        const job = Job.generate({ company });

        em.persist(job);
        await em.flush();

        em.clear();

        const transientJob = TransientJob.generate({
          linkedinId: job.linkedinId
        });

        const updatedJob = await em.repo(Job).resolve(transientJob, company, { em });

        t.assert.equal(updatedJob.id, job.id);
        t.assert.equal(updatedJob.title, transientJob.title);
        t.assert.equal(updatedJob.company.id, company.id);
      })
    );
  });

  after(async () => {
    await orm.close();
  });
});
