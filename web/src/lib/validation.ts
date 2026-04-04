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

// --- Headline ---

interface HeadlineFormState {
  label: string;
  summaryText: string;
}

function validateHeadline(values: HeadlineFormState): ValidationErrors<HeadlineFormState> {
  const errors: ValidationErrors<HeadlineFormState> = {};
  if (!values.label.trim()) errors.label = 'Label is required';
  return errors;
}

// --- Education ---

interface EducationFormState {
  institutionName: string;
  degreeTitle: string;
  graduationYear: string;
  location: string;
  honors: string;
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
  location: string;
  startDate: string;
  endDate: string;
  summary: string;
  narrative: string;
}

function validateExperience(values: ExperienceFormState): ValidationErrors<ExperienceFormState> {
  const errors: ValidationErrors<ExperienceFormState> = {};
  if (!values.title.trim()) errors.title = 'Title is required';
  if (!values.companyName.trim()) errors.companyName = 'Company name is required';
  if (!values.location.trim()) errors.location = 'Location is required';
  if (!values.startDate.trim()) errors.startDate = 'Start date is required';
  if (!values.endDate.trim()) errors.endDate = 'End date is required';
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

export type {
  AccomplishmentFormState,
  EducationFormState,
  ExperienceFormState,
  HeadlineFormState,
  ProfileFormState,
  ValidationErrors
};
export { hasErrors, validateAccomplishment, validateEducation, validateExperience, validateHeadline, validateProfile };
