import * as Url from 'node:url';
import { TimeUtil, type TypeUtil } from '@tailoredin/shared';
import { omit, range } from 'lodash';
import * as NpmLog from 'npmlog';
import type * as Playwright from 'playwright';
import type { Locator } from 'playwright';
import { LinkedInUrls } from './LinkedInExplorer.js';
export type LinkedInSearchJobsCommandParams = {
  keywords: string;
  location: 'US' | 'NY';
  past?: 'month' | 'week' | 'day';
  twoHundredKOrHigher?: boolean;
  jobType?: 'full-time' | 'contract';
  remote?: ('remote' | 'on-site' | 'hybrid')[];
  maxPages?: number;
};

export type LinkedInSearchJobsCommandResult = {
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
  description_html: string;

  companyName: string;
  companyLogoUrl: string;
  companyLink: string;
  companyWebsite: string | null;
};
type LinkedInSearchJobsCommandResultListInfo = Pick<LinkedInSearchJobsCommandResult, 'jobId' | 'companyLogoUrl'>;
type LinkedInSearchJobsCommandResultDetailsInfo = Omit<
  LinkedInSearchJobsCommandResult,
  keyof LinkedInSearchJobsCommandResultListInfo
>;

export type LinkedInSearchJobsCommandParseApplicationDetailsDelegate = () => Promise<
  Pick<LinkedInSearchJobsCommandResult, 'applyLink' | 'companyWebsite'>
>;

export type LinkedInSearchJobsCommandDelegate = TypeUtil.ReturnTypeOrPromise<
  (
    result: LinkedInSearchJobsCommandResult,
    parseApplicationDetailsDelegate: LinkedInSearchJobsCommandParseApplicationDetailsDelegate
  ) => void
>;

export class LinkedInSearchJobsCommand {
  private readonly logPrefix: string = this.constructor.name;

  public constructor(
    private readonly page: Playwright.Page,
    private readonly browserContext: Playwright.BrowserContext
  ) {}

  public async search(params: LinkedInSearchJobsCommandParams, delegate: LinkedInSearchJobsCommandDelegate) {
    NpmLog.info(this.logPrefix, `Search for jobs...`, params);

    const maxPages = params.maxPages ?? Number.POSITIVE_INFINITY;
    const searchParams = this.formatSearchParams(omit(params, ['maxPages']));
    const url = `${LinkedInUrls.JOBS_SEARCH}?${searchParams.toString()}`;

    await this.page.goto(url, {
      waitUntil: 'load'
    });

    const pageNumbers = (await this.parsePagination()).slice(0, maxPages);

    for (const pageNumber of pageNumbers) {
      NpmLog.notice(this.logPrefix, `Parsing page ${pageNumber} of ${pageNumbers.length}...`);

      if (pageNumber !== 1) {
        await this.loadNextPage(pageNumber);
      }

      await this.parseCurrentPage(delegate);
    }
  }

  private async parseJobListLocators() {
    const jobListLocators: Locator[] = [];

    const jobListContainerSelector = 'div.scaffold-layout__list';
    const jobListItemContainerSelector = 'li.scaffold-layout__list-item';

    await this.page.waitForSelector(jobListContainerSelector);

    const jobsListItems = this.page.locator(jobListItemContainerSelector);
    const count = await jobsListItems.count();

    for (let i = 0; i < count; i++) {
      jobListLocators.push(jobsListItems.nth(i));
    }

    const boundingBox = await this.page.locator(jobListContainerSelector).boundingBox();

    return { jobListLocators: jobListLocators, jobListBoundingBox: boundingBox! };
  }

  private async parseCurrentPage(delegate: LinkedInSearchJobsCommandDelegate): Promise<void> {
    await this.waitRandom(1000);

    const { jobListLocators, jobListBoundingBox } = await this.parseJobListLocators();
    const jobDetailsWrapperSelector = 'div.jobs-search__job-details--wrapper';

    NpmLog.notice(this.logPrefix, `Found ${jobListLocators.length} jobs on current page.`);

    // Place the mouse within the list.
    await this.page.mouse.move(jobListBoundingBox.x + 10, jobListBoundingBox.y + 10);

    for (const jobListLocator of jobListLocators) {
      try {
        await jobListLocator.click();
        const jobListInfo = await this.parseJobListInfo(jobListLocator);
        const jobDetailsInfo = await this.parseJobDetailsInfo(jobDetailsWrapperSelector);
        const fullJobInfo = {
          ...jobDetailsInfo,
          ...jobListInfo
        } satisfies LinkedInSearchJobsCommandResult;

        await delegate(fullJobInfo, async () => {
          const applyLink = await this.findApplyLink(jobDetailsWrapperSelector);

          await this.waitRandom();

          const companyWebsite = await this.findCompanyWebsite(jobDetailsInfo.companyLink);

          fullJobInfo.applyLink = applyLink;
          fullJobInfo.companyWebsite = companyWebsite;

          return { applyLink, companyWebsite };
        });

        await this.page.mouse.wheel(0, 128);
        await this.waitRandom();
      } catch (err) {
        NpmLog.error(this.logPrefix, `An error occurred while parsing a job`, err);
      }
    }
  }

  private async findCompanyWebsite(companyLink: string): Promise<string | null> {
    const companyAboutLink = this.makeCompanyLink(companyLink, 'about');
    const companyAboutPage = await this.browserContext.newPage();

    await companyAboutPage.goto(companyAboutLink, {
      waitUntil: 'load'
    });

    const overviewLocator = companyAboutPage.locator('section.org-page-details-module__card-spacing').first();
    const companyWebsiteLinkLocator = overviewLocator.locator('a[target="_blank"]').first();
    const companyWebsiteLinkText = (await companyWebsiteLinkLocator.innerText()).trim();

    let companyWebsite: string | null = null;

    if (Url.URL.canParse(companyWebsiteLinkText)) {
      const parsed = new Url.URL(companyWebsiteLinkText);

      companyWebsite = Url.format({
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        pathname: parsed.pathname
      });
    }

    await companyAboutPage.close();

    return companyWebsite;
  }

  private async findApplyLink(jobDetailsWrapperSelector: string): Promise<string | null> {
    const jobDetailsWrapperLocator = this.page.locator(jobDetailsWrapperSelector);
    const applyButtonLocators = await jobDetailsWrapperLocator
      .locator('div.jobs-apply-button--top-card > button')
      .all();

    let applyButtonLocator: Playwright.Locator | null = null;

    for (const candidateLocator of applyButtonLocators) {
      const innerText = (await candidateLocator.innerText()).trim();

      // Empty and Easy Apply buttons are ignored.
      if (innerText === 'Apply') {
        applyButtonLocator = candidateLocator;
        break;
      }
    }

    if (applyButtonLocator === null) {
      return null;
    }

    const applyPagePromise = this.page.context().waitForEvent('page');
    await applyButtonLocator.click();

    const applyPage = await applyPagePromise;
    await applyPage.waitForLoadState('domcontentloaded');

    let applyUrl = applyPage.url();

    if (Url.URL.canParse(applyUrl)) {
      const parsed = new Url.URL(applyUrl);

      applyUrl = Url.format({
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        pathname: parsed.pathname
      });
    }

    await applyPage.close();

    return applyUrl;
  }

  private async parseJobDetailsInfo(
    jobDetailsWrapperSelector: string
  ): Promise<LinkedInSearchJobsCommandResultDetailsInfo> {
    await this.page.waitForSelector(jobDetailsWrapperSelector);

    const jobDetailsWrapperLocator = this.page.locator(jobDetailsWrapperSelector);

    const jobTitleLocator = jobDetailsWrapperLocator.locator(
      'div.job-details-jobs-unified-top-card__job-title > h1 > a'
    );
    const companyNameLocator = jobDetailsWrapperLocator.locator(
      'div.job-details-jobs-unified-top-card__company-name > a'
    );
    const locationAndPostedLocator = jobDetailsWrapperLocator.locator(
      'div.job-details-jobs-unified-top-card__primary-description-container > div > span'
    );
    const salaryRemoteLevelAndTypeLocator = jobDetailsWrapperLocator.locator(
      'button.job-details-preferences-and-skills > div.job-details-preferences-and-skills__pill > span > span:not(.visually-hidden)'
    );
    const descriptionLocator = jobDetailsWrapperLocator.locator('div.jobs-description div.mt4');

    const jobTitle = (await jobTitleLocator.first().innerText()).trim();
    const jobLink = (await jobTitleLocator.getAttribute('href')) as string;
    const companyName = (await companyNameLocator.first().innerText()).trim();
    const companyLink = (await companyNameLocator.getAttribute('href')) as string;
    const location = (await locationAndPostedLocator.nth(0).innerText()).trim();
    const posted = (await locationAndPostedLocator.nth(2).innerText()).trim();
    const applicants = (await locationAndPostedLocator.nth(3).innerText()).trim();
    const description = (await descriptionLocator.first().innerText()).trim();
    const descriptionHtml = (await descriptionLocator.first().innerHTML()).trim();

    const salaryRemoteLevelAndTypeLocatorCount = await salaryRemoteLevelAndTypeLocator.count();

    let salary: string | null = null;
    let remote: string | null = null;
    let jobLevel: string | null = null;
    let jobType: string | null = null;

    for (let i = 0; i < salaryRemoteLevelAndTypeLocatorCount; i++) {
      let current = (await salaryRemoteLevelAndTypeLocator.nth(i).innerText()).trim();

      const idx = current.indexOf('Matches your job preferences');

      if (idx >= 0) {
        current = current.slice(0, idx).trim();
      }

      if (current.includes('$')) {
        salary = current;
      } else if (['Remote', 'On-site', 'Hybrid'].includes(current)) {
        remote = current;
      } else if (current.includes('level')) {
        jobLevel = current;
      } else if (['Full-time', 'Contract'].includes(current)) {
        jobType = current;
      }
      // Otherwise just ignore.
    }

    return {
      jobTitle: jobTitle,
      jobLink: jobLink,
      companyName: companyName,
      companyLink: this.makeCompanyLink(companyLink),
      location: location,
      posted: posted,
      salary: salary,
      remote: remote,
      jobType: jobType,
      jobLevel: jobLevel,
      description: description,
      description_html: descriptionHtml,
      applyLink: null,
      companyWebsite: null,
      applicants: applicants
    } satisfies LinkedInSearchJobsCommandResultDetailsInfo;
  }

  private async parseJobListInfo(locator: Locator): Promise<LinkedInSearchJobsCommandResultListInfo> {
    const divWithJobIdLocator = locator.locator('div.job-card-container');
    const companyLogoLocator = divWithJobIdLocator.locator('div.job-card-list__logo > div > div > img');

    const jobId = await divWithJobIdLocator.first().getAttribute('data-job-id');
    const companyLogoUrl = await companyLogoLocator.first().getAttribute('src');

    return {
      jobId: jobId as string,
      companyLogoUrl: companyLogoUrl as string
    } satisfies LinkedInSearchJobsCommandResultListInfo;
  }

  private async loadNextPage(pageNumber: number): Promise<void> {
    const paginationContainerSelector = 'div.jobs-search-results-list__pagination';
    const nextPageLocator = this.page.locator(
      `${paginationContainerSelector} > ul > li > button[aria-label="Page ${pageNumber}"]`
    );
    const exists = (await nextPageLocator.count()) === 1;

    if (!exists) {
      // Need to click dot dot dot...
      throw new Error(`Page ${pageNumber} not found: DOT DOT DOT`);
    }

    await nextPageLocator.click();
    await this.page.waitForLoadState('load');
  }

  private async parsePagination() {
    const { jobListLocators } = await this.parseJobListLocators();

    if (jobListLocators.length < 25) {
      return [1];
    }

    const paginationContainerSelector = 'div.jobs-search-results-list__pagination';

    await this.page.waitForSelector(paginationContainerSelector);

    const lastPageStr = await this.page.locator(`${paginationContainerSelector} > ul > li > button`).last().innerText();
    const lastPageNumber = parseInt(lastPageStr.trim(), 10);

    return range(1, lastPageNumber + 1);
  }

  private makeCompanyLink(rawCompanyLink: string, path = ''): string {
    path = path.replace('/', '').trim(); // Sanitize.

    const parsed = new Url.URL(rawCompanyLink);

    const basePathNameParts = parsed.pathname
      .split('/')
      .filter(p => p.trim() !== '')
      .slice(0, 2);

    const fullPathNameParts = path === '' ? basePathNameParts : [...basePathNameParts, path];

    return Url.format({
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      pathname: fullPathNameParts.join('/')
    });
  }

  private async waitRandom(min = 500, max = min * 4) {
    await TimeUtil.waitRandom(min, max);
  }

  private formatSearchParams(params: LinkedInSearchJobsCommandParams): URLSearchParams {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      switch (key) {
        case 'twoHundredKOrHigher':
          searchParams.append('f_SB2', '9');
          break;
        case 'past': {
          // eslint-disable-next-line no-case-declarations
          let ts: number;
          switch (value) {
            case 'month':
              ts = 2592000;
              break;
            case 'week':
              ts = 604800;
              break;
            case 'day':
              ts = 86400;
              break;
            default:
              throw new Error(`Unknown value for ${key}: ${value}`);
          }
          searchParams.append('f_TPR', `r${ts}`);
          break;
        }
        case 'jobType': {
          // eslint-disable-next-line no-case-declarations
          let t: string;
          switch (value) {
            case 'full-time':
              t = 'F';
              break;
            case 'contract':
              t = 'C';
              break;
            default:
              throw new Error(`Unknown value for ${key}: ${value}`);
          }
          searchParams.append('f_JT', t);
          break;
        }
        case 'keywords':
          searchParams.append('keywords', value as string);
          break;
        case 'location': {
          // eslint-disable-next-line no-case-declarations
          let geoId: number;
          switch (value) {
            case 'NY':
              geoId = 102571732;
              break;
            case 'US':
              geoId = 103644278;
              break;
            default:
              throw new Error(`Unsupported value for ${key}: ${value}`);
          }
          searchParams.append('geoId', geoId.toString());
          break;
        }
        case 'remote':
          for (const val of value as string[]) {
            switch (val) {
              case 'on-site':
                searchParams.append('f_WT', '1');
                break;
              case 'remote':
                searchParams.append('f_WT', '2');
                break;
              case 'hybrid':
                searchParams.append('f_WT', '3');
                break;
              default:
                throw new Error(`Unsupported value for ${key}: ${val}`);
            }
          }
          break;
        default:
          throw new Error(`${key}: ${value} - unknown param.`);
      }
    }

    // searchParams.append('refresh', 'true');

    return searchParams;
  }
}
