/* eslint-disable */

import { Job } from './src/orm/entities/jobs/Job';
import { Collection, EntityKey } from '@mikro-orm/core';
import { RefOrEntity } from './src/orm/helpers';
import { container } from './src/di/container';
import { MikroORM } from '@mikro-orm/postgresql';
import { DI } from './src/di/DI';
import * as TsMorph from 'ts-morph';
import { InspectUtil } from './src/utils/InspectUtil';
import { jsonInputForTargetLanguage, InputData, quicktype, typeScriptZodOptions } from 'quicktype-core';

type Foo<T> = {
  [K in EntityKey<T>]: T[K] extends Collection<infer U> ? Foo<U>[] : T[K] extends RefOrEntity<infer U> ? Foo<U> : never;
};

type JobFoo = Foo<Job>;

Promise.resolve()
  .then(async () => {
    const orm = container.get<MikroORM>(DI.Orm);
    const companyJobs = await orm.em.repo(Job).findByCompanyNameLike('air', {
      populate: ['company']
    });

    InspectUtil.inspect(companyJobs);

    // const job = await orm.em.repo(Job).findScoredByIdOrFail(
    //   {
    //     jobId: '0219b4b2-1fd3-4793-a57d-18e458e91583',
    //     targetSalary: 215000
    //   },
    //   {
    //     populate: ['company', 'statusUpdates']
    //   }
    // );

    // const project = new TsMorph.Project({
    //   tsConfigFilePath: 'tsconfig.json'
    // });
    //
    // project.addSourceFileAtPath('Job.ts');
    // const sourceFile = project.getSourceFileOrThrow('Job.ts');
    // const jobType = sourceFile.getTypeAlias('Job')!;
    // InspectUtil.inspect(jobType.getDescendants().map(c => c.getText()));

    // const jsonStr = JSON.stringify(job, null, 2);
    // const jsonInput = jsonInputForTargetLanguage('typescript');
    // await jsonInput.addSource({ name: 'Job', samples: [jsonStr] });
    //
    // const inputData = new InputData();
    // inputData.addInput(jsonInput);
    //
    // const result = await quicktype({
    //   inputData,
    //   lang: 'typescript-zod'
    // });
  })
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
