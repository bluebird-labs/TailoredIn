import type { Application, ApplicationStatus } from '@tailoredin/domain';

export type ApplicationDto = {
  readonly id: string;
  readonly profileId: string;
  readonly companyId: string;
  readonly status: ApplicationStatus;
  readonly jobDescriptionId: string | null;
  readonly notes: string | null;
  readonly archiveReason: string | null;
  readonly withdrawReason: string | null;
  readonly appliedAt: string;
  readonly updatedAt: string;
};

export function toApplicationDto(application: Application): ApplicationDto {
  return {
    id: application.id,
    profileId: application.profileId,
    companyId: application.companyId,
    status: application.status,
    jobDescriptionId: application.jobDescriptionId,
    notes: application.notes,
    archiveReason: application.archiveReason,
    withdrawReason: application.withdrawReason,
    appliedAt: application.appliedAt.toISOString(),
    updatedAt: application.updatedAt.toISOString()
  };
}
