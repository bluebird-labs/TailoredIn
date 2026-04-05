import type { Application, ApplicationStatus } from '@tailoredin/domain';

export type ApplicationDto = {
  readonly id: string;
  readonly profileId: string;
  readonly companyId: string;
  readonly status: ApplicationStatus;
  readonly jobDescriptionId: string | null;
  readonly notes: string | null;
  readonly appliedAt: string;
  readonly updatedAt: string;
};

export function toApplicationDto(application: Application): ApplicationDto {
  return {
    id: application.id.value,
    profileId: application.profileId,
    companyId: application.companyId,
    status: application.status,
    jobDescriptionId: application.jobDescriptionId,
    notes: application.notes,
    appliedAt: application.appliedAt.toISOString(),
    updatedAt: application.updatedAt.toISOString()
  };
}
