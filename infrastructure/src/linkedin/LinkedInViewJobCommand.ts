import * as Url from 'node:url';
import { Logger, TimeUtil } from '@tailoredin/core';
import type * as Playwright from 'playwright';
import { LinkedInUrls } from './LinkedInUrls.js';

export type LinkedInJobResult = {
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

export type LinkedInViewJobCommandResult = {
  result: LinkedInJobResult;
  fetchDetails: () => Promise<{ applyLink: string | null; companyWebsite: string | null }>;
};

export class LinkedInViewJobCommand {
  private readonly log = Logger.create('LinkedInViewJobCommand');

  public constructor(
    private readonly page: Playwright.Page,
    private readonly browserContext: Playwright.BrowserContext
  ) {}

  public async scrape(url: string): Promise<LinkedInViewJobCommandResult> {
    const jobId = this.extractJobId(url);
    this.log.info(`Scraping job ${jobId} from ${url}...`);

    await this.page.goto(`${LinkedInUrls.JOB_VIEW}/${jobId}`, { waitUntil: 'load' });
    await TimeUtil.waitRandom(1000, 2000);

    const wrapperSelector = 'div.jobs-unified-top-card';
    await this.page.waitForSelector(wrapperSelector, { timeout: 15000 });

    const result = await this.parseJobDetails(jobId);

    return {
      result,
      fetchDetails: async () => {
        const applyLink = await this.findApplyLink();
        await TimeUtil.waitRandom(500, 1500);
        const companyWebsite = await this.findCompanyWebsite(result.companyLink);
        return { applyLink, companyWebsite };
      }
    };
  }

  private extractJobId(url: string): string {
    const match = url.match(/linkedin\.com\/jobs\/view\/(\d+)/);
    if (!match?.[1]) {
      throw new Error(`Could not extract job ID from URL: ${url}`);
    }
    return match[1];
  }

  private async parseJobDetails(jobId: string): Promise<LinkedInJobResult> {
    const jobTitleLocator = this.page.locator('div.job-details-jobs-unified-top-card__job-title > h1 > a');
    const companyNameLocator = this.page.locator('div.job-details-jobs-unified-top-card__company-name > a');
    const locationAndPostedLocator = this.page.locator(
      'div.job-details-jobs-unified-top-card__primary-description-container > div > span'
    );
    const salaryRemoteLevelAndTypeLocator = this.page.locator(
      'button.job-details-preferences-and-skills > div.job-details-preferences-and-skills__pill > span > span:not(.visually-hidden)'
    );
    const descriptionLocator = this.page.locator('div.jobs-description div.mt4');
    const companyLogoLocator = this.page.locator('img.job-details-jobs-unified-top-card__company-logo');

    const jobTitle = (await jobTitleLocator.first().innerText()).trim();
    const jobLink = (await jobTitleLocator.getAttribute('href')) as string;
    const companyName = (await companyNameLocator.first().innerText()).trim();
    const rawCompanyLink = (await companyNameLocator.getAttribute('href')) as string;
    const location = (await locationAndPostedLocator.nth(0).innerText()).trim();
    const posted = (await locationAndPostedLocator.nth(2).innerText()).trim();
    const applicants = (await locationAndPostedLocator.nth(3).innerText()).trim();
    const description = (await descriptionLocator.first().innerText()).trim();
    const descriptionHtml = (await descriptionLocator.first().innerHTML()).trim();

    let companyLogoUrl = '';
    if ((await companyLogoLocator.count()) > 0) {
      companyLogoUrl = ((await companyLogoLocator.first().getAttribute('src')) ?? '').trim();
    }

    const { salary, remote, jobLevel, jobType } = await this.parsePills(salaryRemoteLevelAndTypeLocator);

    return {
      jobId,
      jobTitle,
      jobLink,
      companyName,
      companyLink: this.normalizeCompanyLink(rawCompanyLink),
      companyLogoUrl,
      location,
      posted,
      applicants,
      description,
      description_html: descriptionHtml,
      salary,
      remote,
      jobLevel,
      jobType,
      applyLink: null,
      companyWebsite: null
    };
  }

  private async parsePills(
    locator: Playwright.Locator
  ): Promise<{ salary: string | null; remote: string | null; jobLevel: string | null; jobType: string | null }> {
    const count = await locator.count();
    let salary: string | null = null;
    let remote: string | null = null;
    let jobLevel: string | null = null;
    let jobType: string | null = null;

    for (let i = 0; i < count; i++) {
      let current = (await locator.nth(i).innerText()).trim();

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
    }

    return { salary, remote, jobLevel, jobType };
  }

  private async findApplyLink(): Promise<string | null> {
    const applyButtonLocators = await this.page.locator('div.jobs-apply-button--top-card > button').all();

    let applyButtonLocator: Playwright.Locator | null = null;

    for (const candidateLocator of applyButtonLocators) {
      const innerText = (await candidateLocator.innerText()).trim();
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

  private async findCompanyWebsite(companyLink: string): Promise<string | null> {
    const companyAboutLink = this.normalizeCompanyLink(companyLink, 'about');
    const companyAboutPage = await this.browserContext.newPage();

    try {
      await companyAboutPage.goto(companyAboutLink, { waitUntil: 'load' });

      const overviewLocator = companyAboutPage.locator('section.org-page-details-module__card-spacing').first();
      const companyWebsiteLinkLocator = overviewLocator.locator('a[target="_blank"]').first();
      const companyWebsiteLinkText = (await companyWebsiteLinkLocator.innerText()).trim();

      if (Url.URL.canParse(companyWebsiteLinkText)) {
        const parsed = new Url.URL(companyWebsiteLinkText);
        return Url.format({
          protocol: parsed.protocol,
          hostname: parsed.hostname,
          pathname: parsed.pathname
        });
      }

      return null;
    } finally {
      await companyAboutPage.close();
    }
  }

  private normalizeCompanyLink(rawCompanyLink: string, path = ''): string {
    path = path.replace('/', '').trim();
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
}
