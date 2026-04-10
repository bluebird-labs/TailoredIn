type ValidationErrors<T> = Partial<Record<keyof T, string>>;

function hasErrors<T>(errors: ValidationErrors<T>): boolean {
  return Object.keys(errors).length > 0;
}

// --- Profile ---

interface ProfileFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  githubUrl: string;
  websiteUrl: string;
  about: string;
}

function validateProfile(values: ProfileFormState): ValidationErrors<ProfileFormState> {
  const errors: ValidationErrors<ProfileFormState> = {};
  if (!values.firstName.trim()) errors.firstName = 'First name is required';
  if (!values.lastName.trim()) errors.lastName = 'Last name is required';
  if (!values.email.trim()) errors.email = 'Email is required';
  return errors;
}

// --- Education ---

interface EducationFormState {
  institutionName: string;
  degreeTitle: string;
  graduationYear: string;
  location: string;
  honors: string;
  hiddenByDefault: string;
}

function validateEducation(values: EducationFormState): ValidationErrors<EducationFormState> {
  const errors: ValidationErrors<EducationFormState> = {};
  if (!values.institutionName.trim()) errors.institutionName = 'Institution name is required';
  if (!values.degreeTitle.trim()) errors.degreeTitle = 'Degree title is required';
  const year = Number.parseInt(values.graduationYear, 10);
  if (!values.graduationYear.trim() || Number.isNaN(year)) errors.graduationYear = 'Valid graduation year is required';
  return errors;
}

// --- Experience ---

interface ExperienceFormState {
  title: string;
  companyName: string;
  companyWebsite: string;
  companyAccent: string;
  location: string;
  startDate: string;
  endDate: string;
  summary: string;
  bulletMin: number;
  bulletMax: number;
}

function validateExperience(values: ExperienceFormState): ValidationErrors<ExperienceFormState> {
  const errors: ValidationErrors<ExperienceFormState> = {};
  if (!values.title.trim()) errors.title = 'Title is required';
  if (!values.companyName.trim()) errors.companyName = 'Company name is required';
  if (!values.location.trim()) errors.location = 'Location is required';
  if (!values.startDate.trim()) errors.startDate = 'Start date is required';
  if (!values.endDate.trim()) errors.endDate = 'End date is required';
  if (values.bulletMin < 1) errors.bulletMin = 'Min must be at least 1';
  if (values.bulletMax < values.bulletMin) errors.bulletMax = 'Max must be >= min';
  return errors;
}

// --- Accomplishment ---

interface AccomplishmentFormState {
  title: string;
  narrative: string;
}

function validateAccomplishment(values: AccomplishmentFormState): ValidationErrors<AccomplishmentFormState> {
  const errors: ValidationErrors<AccomplishmentFormState> = {};
  if (!values.title.trim()) errors.title = 'Title is required';
  return errors;
}

// --- Company ---

interface CompanyFormState {
  name: string;
  domainName: string;
  description: string;
  website: string;
  logoUrl: string;
  linkedinLink: string;
  businessType: string;
  industry: string;
  stage: string;
  status: string;
}

function validateCompany(values: CompanyFormState): ValidationErrors<CompanyFormState> {
  const errors: ValidationErrors<CompanyFormState> = {};
  if (!values.name.trim()) errors.name = 'Company name is required';
  if (!values.domainName.trim()) errors.domainName = 'Domain name is required';
  return errors;
}

// --- Job Description ---

interface JobDescriptionFormState {
  title: string;
  description: string;
  url: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  level: string;
  locationType: string;
  postedAt: string;
}

function validateJobDescription(values: JobDescriptionFormState): ValidationErrors<JobDescriptionFormState> {
  const errors: ValidationErrors<JobDescriptionFormState> = {};
  if (!values.title.trim()) errors.title = 'Title is required';
  if (!values.description.trim()) errors.description = 'Description is required';
  return errors;
}

export type {
  AccomplishmentFormState,
  CompanyFormState,
  EducationFormState,
  ExperienceFormState,
  JobDescriptionFormState,
  ProfileFormState,
  ValidationErrors
};
export {
  hasErrors,
  validateAccomplishment,
  validateCompany,
  validateEducation,
  validateExperience,
  validateJobDescription,
  validateProfile
};
