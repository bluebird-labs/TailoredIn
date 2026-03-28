import 'dotenv/config';
import { after, describe, it, type TestContext } from 'node:test';
import { MikroORM } from '@mikro-orm/postgresql';
import { TestUtil } from '@tailoredin/db';
import { makeOrmConfig } from '../../makeOrmConfig.js';
import { Company } from './Company.js';
import { TransientCompany } from './TransientCompany.js';

import withOrm = TestUtil.withOrm;

describe('CompanyRepository', () => {
  const orm = new MikroORM(makeOrmConfig());

  describe('resolve', () => {
    it(
      'should create a new company',
      withOrm(orm, async (t: TestContext, em) => {
        const transientCompany = TransientCompany.generate();
        const company = await em.repo(Company).resolve(transientCompany, { em });

        t.assert.ok(typeof company.id === 'string', 'Company ID should be a string');
        t.assert.equal(company.name, transientCompany.name);
      })
    );

    it(
      'should update an existing company',
      withOrm(orm, async (t: TestContext, em) => {
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

        t.assert.equal(resolvedCompany.id, existingCompany.id);
        t.assert.equal(resolvedCompany.name, transientCompany.name);
        t.assert.equal(resolvedCompany.website, transientCompany.website);
        t.assert.equal(resolvedCompany.logoUrl, transientCompany.logoUrl);
      })
    );
  });

  after(async () => {
    await orm.close();
  });
});
