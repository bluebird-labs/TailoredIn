import 'dotenv/config';
import { afterAll, describe, expect, it } from 'bun:test';
import { MikroORM } from '@mikro-orm/postgresql';
import { TestUtil } from '@tailoredin/db';
import { makeOrmConfig } from '../../makeOrmConfig.js';
import { Company } from '../companies/Company.js';
import { Job } from './Job.js';
import { TransientJob } from './TransientJob.js';

const { withOrm } = TestUtil;

describe('JobRepository', () => {
  const orm = new MikroORM(makeOrmConfig());

  describe('resolve', () => {
    it(
      'should create a new job',
      withOrm(orm, async em => {
        const company = Company.generate();

        em.persist(company);
        await em.flush();
        em.clear();

        const transientJob = TransientJob.generate();
        const job = await em.repo(Job).resolve(transientJob, company, { em });

        expect(typeof job.id).toBe('string');
        expect(job.title).toBe(transientJob.title);
      })
    );

    it(
      'should update an existing job',
      withOrm(orm, async em => {
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

        expect(updatedJob.id).toBe(job.id);
        expect(updatedJob.title).toBe(transientJob.title);
        expect(updatedJob.company.id).toBe(company.id);
      })
    );
  });

  afterAll(async () => {
    await orm.close();
  });
});
