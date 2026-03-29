import 'dotenv/config';
import { afterAll, describe, expect, it } from 'bun:test';
import { MikroORM } from '@mikro-orm/postgresql';
import { TestUtil } from '@tailoredin/db';
import { makeOrmConfig } from '../../makeOrmConfig.js';
import { Company } from './Company.js';
import { TransientCompany } from './TransientCompany.js';

const { withOrm } = TestUtil;

describe('CompanyRepository', () => {
  const orm = new MikroORM(makeOrmConfig());

  describe('resolve', () => {
    it(
      'should create a new company',
      withOrm(orm, async em => {
        const transientCompany = TransientCompany.generate();
        const company = await em.repo(Company).resolve(transientCompany, { em });

        expect(typeof company.id).toBe('string');
        expect(company.name).toBe(transientCompany.name);
      })
    );

    it(
      'should update an existing company',
      withOrm(orm, async em => {
        const existingCompany = Company.generate({
          linkedinLink: 'https://www.linkedin.com/company/test-company',
          website: null
        });

        em.persist(existingCompany);
        await em.flush();

        em.clear();

        const transientCompany = TransientCompany.generate({
          linkedinLink: existingCompany.linkedinLink,
          website: 'https://example.com'
        });

        const resolvedCompany = await em.repo(Company).resolve(transientCompany, { em });

        expect(resolvedCompany.id).toBe(existingCompany.id);
        expect(resolvedCompany.name).toBe(transientCompany.name);
        expect(resolvedCompany.website).toBe(transientCompany.website);
        expect(resolvedCompany.logoUrl).toBe(transientCompany.logoUrl);
      })
    );
  });

  afterAll(async () => {
    await orm.close();
  });
});
