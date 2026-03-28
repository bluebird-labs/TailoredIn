import { after, describe, it, TestContext } from 'node:test';
import { TestUtil } from '../../../utils/TestUtil';
import { container } from '../../../di/container';
import { MikroORM } from '@mikro-orm/postgresql';
import { DI } from '../../../di/DI';
import { TransientJob } from './TransientJob';
import { Job } from './Job';
import { Company } from '../companies/Company';
import withOrm = TestUtil.withOrm;

describe('JobRepository', () => {
  const orm = container.get<MikroORM>(DI.Orm);

  describe('resolve', () => {
    it(
      'should create a new job',
      withOrm(orm, async (t: TestContext, em) => {
        const company = Company.generate();

        await em.persistAndFlush(company);
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

        await em.persistAndFlush(company);

        const job = Job.generate({ company });

        await em.persistAndFlush(job);

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
