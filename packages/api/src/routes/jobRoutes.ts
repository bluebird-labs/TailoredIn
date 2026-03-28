import Router                         from '@koa/router';
import { StatusCode }                  from '@tselect/status-code';
import { z }                           from 'zod';
import { JobDescriptionItemsExtractor,
         Job, JobStatus, Company }     from '@tailoredin/db';
import { ResumeGenerator }             from '@tailoredin/resume';
import { MikroORM }                    from '@mikro-orm/postgresql';

export const jobRoutes = (router: Router, orm: MikroORM, resumeGenerator: ResumeGenerator) => {
  router.get('/jobs/tops/next', async ctx => {
    const query = await z
      .strictObject({
        target_salary: z.coerce.number().int().min(100000),
        hours_posted_max: z.coerce.number().int().min(1).default(48)
      })
      .parseAsync(ctx.request.query);

    const topJobs = await orm.em.getRepository(Job).findTopScored(
      {
        top: 1,
        targetSalary: query.target_salary,
        hoursPostedMax: query.hours_posted_max
      },
      {
        populate: ['company', 'statusUpdates']
      }
    );

    const topJob = topJobs[0] ?? null;

    ctx.status = StatusCode.OK;
    ctx.body = {
      data: topJob
        ? {
            ...topJob.toObject(),
            descriptionItems: JobDescriptionItemsExtractor.extractItemsFromJob(topJob)
          }
        : null
    };
  });

  router.get('/jobs/:id', async ctx => {
    const [{ id }, { target_salary }] = await Promise.all([
      z.strictObject({ id: z.string().uuid() }).parseAsync(ctx.params),
      z
        .strictObject({
          target_salary: z.coerce.number().int().min(100000)
        })
        .parseAsync(ctx.request.query)
    ]);

    const job = await orm.em.getRepository(Job).findScoredByIdOrFail(
      {
        jobId: id,
        targetSalary: target_salary
      },
      {
        populate: ['company', 'statusUpdates']
      }
    );

    console.log(JSON.stringify(job, null, 2));

    ctx.status = StatusCode.OK;
    ctx.body = {
      data: {
        ...job.toObject(),
        descriptionItems: JobDescriptionItemsExtractor.extractItemsFromJob(job)
      }
    };
  });

  router.put('/jobs/:id/status', async ctx => {
    const [{ id }, { status }] = await Promise.all([
      z.strictObject({ id: z.string().uuid() }).parseAsync(ctx.params),
      z.strictObject({ status: z.nativeEnum(JobStatus) }).parseAsync(ctx.request.body)
    ]);

    const job = await orm.em.getRepository(Job).findOneOrFail(id);

    job.changeStatus(status);

    await orm.em.flush();

    ctx.status = StatusCode.NO_CONTENT;
  });

  router.put('/jobs/:id/generate-resume', async ctx => {
    const id = ctx.params.id;
    const job = await orm.em.getRepository(Job).findOneOrFail(id, {
      populate: ['company']
    });

    const pdfPath = await resumeGenerator.generateSmartResume({
      job: job,
      company: job.company as Company
    });

    ctx.body = {
      data: {
        pdf_path: pdfPath
      }
    };

    ctx.status = StatusCode.CREATED;
  });
};
