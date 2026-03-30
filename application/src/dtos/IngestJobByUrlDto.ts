export type IngestJobByUrlInput = { mode: 'url'; url: string } | { mode: 'manual'; fields: ManualJobFieldsDto };

export type ManualJobFieldsDto = {
  jobTitle: string;
  companyName: string;
  companyLink: string;
  location: string;
  description: string;
  descriptionHtml: string;
  companyLogoUrl?: string;
  salary?: string | null;
  jobType?: string | null;
  remote?: string | null;
  posted?: string | null;
  jobLevel?: string | null;
  applicants?: string | null;
  applyLink?: string | null;
  companyWebsite?: string | null;
};
