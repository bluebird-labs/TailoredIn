import { MikroORM } from '@mikro-orm/postgresql';
import { Container } from '@needle-di/core';
import {
  AddAccomplishment,
  CreateEducation,
  CreateExperience,
  CreateHeadline,
  DeleteAccomplishment,
  DeleteEducation,
  DeleteExperience,
  DeleteHeadline,
  GetProfile,
  ListEducation,
  ListExperiences,
  ListHeadlines,
  UpdateAccomplishment,
  UpdateEducation,
  UpdateExperience,
  UpdateHeadline,
  UpdateProfile
} from '@tailoredin/application';
import { env, envInt } from '@tailoredin/core';
import {
  createOrmConfig,
  DI,
  PostgresCompanyRepository,
  PostgresEducationRepository,
  PostgresExperienceRepository,
  PostgresHeadlineRepository,
  PostgresProfileRepository
} from '@tailoredin/infrastructure';

const orm = await MikroORM.init(
  createOrmConfig({
    timezone: env('TZ'),
    user: env('POSTGRES_USER'),
    password: env('POSTGRES_PASSWORD'),
    dbName: env('POSTGRES_DB'),
    schema: env('POSTGRES_SCHEMA'),
    host: env('POSTGRES_HOST'),
    port: envInt('POSTGRES_PORT')
  })
);

const container = new Container();

// Infrastructure: ORM
container.bind({ provide: MikroORM, useValue: orm });

// Profile
container.bind({ provide: DI.Profile.Repository, useClass: PostgresProfileRepository });
container.bind({
  provide: DI.Profile.GetProfile,
  useFactory: () => new GetProfile(container.get(DI.Profile.Repository))
});
container.bind({
  provide: DI.Profile.UpdateProfile,
  useFactory: () => new UpdateProfile(container.get(DI.Profile.Repository))
});

// Headlines
container.bind({ provide: DI.Headline.Repository, useClass: PostgresHeadlineRepository });
container.bind({
  provide: DI.Headline.List,
  useFactory: () => new ListHeadlines(container.get(DI.Headline.Repository))
});
container.bind({
  provide: DI.Headline.Create,
  useFactory: () => new CreateHeadline(container.get(DI.Headline.Repository))
});
container.bind({
  provide: DI.Headline.Update,
  useFactory: () => new UpdateHeadline(container.get(DI.Headline.Repository))
});
container.bind({
  provide: DI.Headline.Delete,
  useFactory: () => new DeleteHeadline(container.get(DI.Headline.Repository))
});

// Education
container.bind({ provide: DI.Education.Repository, useClass: PostgresEducationRepository });
container.bind({
  provide: DI.Education.ListEducation,
  useFactory: () => new ListEducation(container.get(DI.Education.Repository))
});
container.bind({
  provide: DI.Education.CreateEducation,
  useFactory: () => new CreateEducation(container.get(DI.Education.Repository))
});
container.bind({
  provide: DI.Education.UpdateEducation,
  useFactory: () => new UpdateEducation(container.get(DI.Education.Repository))
});
container.bind({
  provide: DI.Education.DeleteEducation,
  useFactory: () => new DeleteEducation(container.get(DI.Education.Repository))
});

// Experience
container.bind({ provide: DI.Experience.Repository, useClass: PostgresExperienceRepository });
container.bind({
  provide: DI.Experience.List,
  useFactory: () => new ListExperiences(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.Create,
  useFactory: () => new CreateExperience(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.Update,
  useFactory: () => new UpdateExperience(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.Delete,
  useFactory: () => new DeleteExperience(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.AddAccomplishment,
  useFactory: () => new AddAccomplishment(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.UpdateAccomplishment,
  useFactory: () => new UpdateAccomplishment(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.DeleteAccomplishment,
  useFactory: () => new DeleteAccomplishment(container.get(DI.Experience.Repository))
});

// Company
container.bind({ provide: DI.Company.Repository, useClass: PostgresCompanyRepository });

export { container };
