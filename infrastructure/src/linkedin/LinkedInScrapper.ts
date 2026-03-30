import { TimeUtil } from '@tailoredin/core';
import { Logger } from '@tailoredin/core/src/Logger.js';
import { range } from 'lodash';
import type { Locator } from 'playwright';
import * as PlayWright from 'playwright';
import { LinkedInUrls } from './LinkedInExplorer.js';
export type LinkedInScrapperConfig = {
  email: string;
  password: string;
  headless: boolean;
};

export type JobSearchParams = {
  keywords: string;
  location: 'US' | 'NY';
  past?: 'month' | 'week' | 'day';
  twoHundredKOrHigher?: boolean;
  jobType?: 'full-time' | 'contract';
  remote?: ('remote' | 'on-site' | 'hybrid')[];
};

export type JobSearchResult = {
  jobId: string;
  jobLink: string;

  jobTitle: string;
  location: string;
  salary: string | null;
  jobType: string | null;
  remote: string | null;
  posted: string | null;
  description: string;
  description_html: string;

  jobLevel: string | null;

  companyName: string;
  companyLogoUrl: string;
  companyLink: string;
};

type JobSearchResultListInfo = Pick<JobSearchResult, 'jobId' | 'companyLogoUrl'>;
type JobSearchResultDetailsInfo = Omit<JobSearchResult, keyof JobSearchResultListInfo>;

export type JobResultCallback = (job: JobSearchResult) => void | Promise<void>;

export class LinkedInScrapper {
  private readonly log = Logger.create('LinkedInScrapper');
  private readonly email: string;
  private readonly password: string;
  private readonly headless: boolean;

  public constructor(config: LinkedInScrapperConfig) {
    this.email = config.email;
    this.password = config.password;
    this.headless = config.headless;
    this._browser = null;
    this._page = null;
  }

  private _browser: PlayWright.Browser | null;

  private get browser(): PlayWright.Browser {
    if (this._browser === null) {
      throw new Error(`${this.constructor.name} needs to be .open()`);
    }
    return this._browser;
  }

  private _page: PlayWright.Page | null;

  // Needs setup be called.
  private get page(): PlayWright.Page {
    if (this._page === null) {
      throw new Error(`${this.constructor.name} needs to be .open()`);
    }
    return this._page;
  }

  public async open() {
    this.log.info('Setting up scrapper...');

    this._browser = await PlayWright.chromium.launch({ headless: this.headless });
    this._page = await this.browser.newPage({
      baseURL: LinkedInUrls.BASE
    });
  }

  public async close() {
    await this.browser.close();
  }

  public async login() {
    this.log.info('Logging in...');

    await this.page.goto(LinkedInUrls.LOGIN, {
      waitUntil: 'load',
      timeout: 100000
    });

    const usernameInput = this.page.locator('#username');
    await usernameInput.click();
    await usernameInput.fill(this.email);

    await this.waitRandom();

    const passwordInput = this.page.locator('#password');
    await passwordInput.click();
    await passwordInput.fill(this.password);

    await this.waitRandom();

    const submitButton = this.page.locator('button[type="submit"]');
    await submitButton.click();

    await this.page.waitForLoadState('load');

    if (this.page.url().includes('checkpoint/challenge')) {
      this.log.info('Captcha challenge!');

      if (this.headless) {
        this.log.warn('Aborting due to captcha in headless mode.');
        return;
      }

      while (true) {
        if (!this.page.url().includes('checkpoint/challenge')) {
          this.log.info('Captcha solved!');
          break;
        }
        await TimeUtil.wait(2000);
      }

      await this.page.waitForTimeout(5000);
    }
  }

  public async searchJobs(params: JobSearchParams, callback: JobResultCallback) {
    this.log.info('Searching jobs...');

    const searchParams = this.formatSearchParams(params);
    const url = `${LinkedInUrls.JOBS_SEARCH}?${searchParams.toString()}`;

    await this.page.goto(url, {
      waitUntil: 'load'
    });

    const pageNumbers = await this.parsePagination();

    for (const pageNumber of pageNumbers) {
      this.log.info(`Parsing page ${pageNumber} of ${pageNumbers.length}...`);

      if (pageNumber !== 1) {
        await this.loadNextPage(pageNumber);
      }

      await this.parseCurrentPage(callback);
    }
  }

  private async parseCurrentPage(callback: JobResultCallback): Promise<void> {
    const { jobListLocators, jobListBoundingBox } = await this.parseJobListLocators();

    this.log.info(`Found ${jobListLocators.length} jobs on current page.`);

    // Place the mouse within the list.
    await this.page.mouse.move(jobListBoundingBox.x + 10, jobListBoundingBox.y + 10);

    for (const jobListLocator of jobListLocators) {
      try {
        await jobListLocator.click();
        const jobListInfo = await this.parseJobListInfo(jobListLocator);
        const jobDetailsInfo = await this.parseJobDetailsInfo(jobListInfo.jobId);
        await callback({
          ...jobDetailsInfo,
          ...jobListInfo
        });
        await this.page.mouse.wheel(0, 128);
        await this.waitRandom();
      } catch (err) {
        this.log.error('An error occurred while parsing a job', err);
      }
    }
  }

  private async parseJobDetailsInfo(jobId: string): Promise<JobSearchResultDetailsInfo> {
    const jobDetailsWrapperSelector = 'div.jobs-search__job-details--wrapper';

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

    const jobDetailsInfo: JobSearchResultDetailsInfo = {
      jobTitle: jobTitle,
      jobLink: jobLink,
      companyName: companyName,
      companyLink: companyLink,
      location: location,
      posted: posted,
      salary: salary,
      remote: remote,
      jobType: jobType,
      jobLevel: jobLevel,
      description: description,
      description_html: descriptionHtml
    };

    this.log.info(`Parsed details for job ${jobId}`);

    return jobDetailsInfo;
  }

  private async parseJobListInfo(locator: Locator): Promise<JobSearchResultListInfo> {
    const divWithJobIdLocator = locator.locator('div.job-card-container');
    const companyLogoLocator = divWithJobIdLocator.locator('div.job-card-list__logo > div > div > img');

    const jobId = await divWithJobIdLocator.first().getAttribute('data-job-id');
    const companyLogoUrl = await companyLogoLocator.first().getAttribute('src');

    const jobListInfo: JobSearchResultListInfo = {
      jobId: jobId as string,
      companyLogoUrl: companyLogoUrl as string
    };

    this.log.info(`Found job in list: ${jobListInfo.jobId}`);

    return jobListInfo;
  }

  private async parseJobListLocators() {
    const jobListLocators: Locator[] = [];

    const jobListContainerSelector = 'div.scaffold-layout__list';
    const jobListItemContainerSelector = 'li.scaffold-layout__list-item';

    await this.page.waitForSelector(jobListContainerSelector);

    const jobsListItems = this.page.locator(`${jobListItemContainerSelector}`);
    const count = await jobsListItems.count();

    for (let i = 0; i < count; i++) {
      jobListLocators.push(jobsListItems.nth(i));
    }

    const boundingBox = await this.page.locator(jobListContainerSelector).boundingBox();

    return { jobListLocators: jobListLocators, jobListBoundingBox: boundingBox! };
  }

  private async loadNextPage(pageNumber: number): Promise<void> {
    const paginationContainerSelector = 'div.jobs-search-results-list__pagination';
    const nextPageLocator = this.page.locator(
      `${paginationContainerSelector} > ul > li > button[aria-label="Page ${pageNumber}"]`
    );
    const exists = (await nextPageLocator.count()) === 1;

    if (!exists) {
      // Need to click dot dot dot...
      throw new Error(`Page ${pageNumber} not found`);
    }

    await nextPageLocator.click();
    await this.page.waitForLoadState('load');
  }

  private async parsePagination() {
    const paginationContainerSelector = 'div.jobs-search-results-list__pagination';

    await this.page.waitForSelector(paginationContainerSelector);

    const lastPageStr = await this.page.locator(`${paginationContainerSelector} > ul > li > button`).last().innerText();
    const lastPageNumber = parseInt(lastPageStr.trim(), 10);

    return range(1, lastPageNumber + 1);
  }

  private formatSearchParams(params: JobSearchParams): URLSearchParams {
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

    return searchParams;
  }

  private async waitRandom(min = 500, max = 2000) {
    await TimeUtil.waitRandom(min, max);
  }
}
