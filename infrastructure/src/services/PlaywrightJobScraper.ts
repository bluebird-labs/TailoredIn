import FS from 'node:fs';
import { inject, injectable } from '@needle-di/core';
import type { JobScraper, JobSearchConfigDto, ScrapeResultCallback } from '@tailoredin/application';
import { TimeUtil } from '@tailoredin/core';
import * as NpmLog from 'npmlog';
import * as Playwright from 'playwright';
import { DEFAULT_AUTH_FILE as AUTH_FILE } from '../linkedin/LinkedInExplorer.js';
import { LinkedInSearchJobsCommand } from '../linkedin/LinkedInSearchJobsCommand.js';
import { LinkedInUrls } from '../linkedin/LinkedInUrls.js';

export const PLAYWRIGHT_JOB_SCRAPER_CONFIG = 'PlaywrightJobScraperConfig';

export type PlaywrightJobScraperConfig = {
  headless: boolean;
  slowMo: number;
  email: string;
  password: string;
};

@injectable()
export class PlaywrightJobScraper implements JobScraper {
  private browser!: Playwright.Browser;
  private browserContext!: Playwright.BrowserContext;
  private page!: Playwright.Page;
  private searchCommand!: LinkedInSearchJobsCommand;

  constructor(private readonly config = inject(PLAYWRIGHT_JOB_SCRAPER_CONFIG) as PlaywrightJobScraperConfig) {}

  async connect(): Promise<void> {
    NpmLog.info(PlaywrightJobScraper.name, 'Launching browser...');

    this.browser = await Playwright.chromium.launch({
      headless: this.config.headless,
      slowMo: this.config.slowMo
    });

    this.browserContext = await this.browser.newContext({
      baseURL: LinkedInUrls.BASE,
      storageState: FS.existsSync(AUTH_FILE) ? AUTH_FILE : undefined
    });

    this.page = await this.browserContext.newPage();
    this.searchCommand = new LinkedInSearchJobsCommand(this.page, this.browserContext);

    await this.page.goto(LinkedInUrls.FEED, { waitUntil: 'load' });

    if (await this.isLoggedOut()) {
      await this.login();
    }
  }

  async close(): Promise<void> {
    await this.browser?.close();
  }

  async search(config: JobSearchConfigDto, onResult: ScrapeResultCallback): Promise<void> {
    await this.searchCommand.search(config, async (result, parseDetails) => {
      await onResult(
        {
          jobId: result.jobId,
          jobTitle: result.jobTitle,
          jobLink: result.jobLink,
          applyLink: result.applyLink,
          location: result.location,
          salary: result.salary,
          jobType: result.jobType,
          remote: result.remote,
          posted: result.posted,
          jobLevel: result.jobLevel,
          applicants: result.applicants,
          description: result.description,
          descriptionHtml: result.description_html,
          companyName: result.companyName,
          companyLogoUrl: result.companyLogoUrl,
          companyLink: result.companyLink,
          companyWebsite: result.companyWebsite
        },
        parseDetails
      );
    });
  }

  private async isLoggedOut(): Promise<boolean> {
    return (await this.page.getByText(/sign in/i).count()) > 0;
  }

  private async login(): Promise<void> {
    NpmLog.info(PlaywrightJobScraper.name, 'Logging in...');
    await this.page.goto(LinkedInUrls.LOGIN);
    await this.page.fill('input[name="session_key"]', this.config.email);
    await this.page.fill('input[name="session_password"]', this.config.password);
    await this.page.click('button[type="submit"]');
    await this.browserContext.storageState({ path: AUTH_FILE });
    await TimeUtil.waitRandom(500, 2000);
  }
}
