/** Raw data returned by the LinkedIn scraper for a single job posting. */
export type ScrapeResultDto = {
  jobId: string;
  jobTitle: string;
  jobLink: string;
  applyLink: string | null;
  location: string;
  salary: string | null;
  jobType: string | null;
  remote: string | null;
  posted: string | null;
  jobLevel: string | null;
  applicants: string | null;
  description: string;
  descriptionHtml: string;
  companyName: string;
  companyLogoUrl: string;
  companyLink: string;
  companyWebsite: string | null;
};
