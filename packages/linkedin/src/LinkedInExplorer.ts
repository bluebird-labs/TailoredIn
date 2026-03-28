import * as PlayWright from 'playwright';
import * as NpmLog from 'npmlog';
import * as NPMLog from 'npmlog';
import { milliseconds } from 'date-fns';
import { TimeUtil } from '@tailoredin/shared';
import {
  LinkedInSearchJobsCommand,
  LinkedInSearchJobsCommandDelegate,
  LinkedInSearchJobsCommandParams
} from './LinkedInSearchJobsCommand.js';
import Path from 'node:path';
import { PACKAGE_DIR } from './PACKAGE_DIR.js';
import FS from 'node:fs';
import { inject, injectable } from 'inversify';
import { LinkedInDI } from './DI.js';

export type LinkedInExplorerConfig = {
  headless: boolean;
  slowMo: number;
  email: string;
  password: string;
};

export enum LinkedInUrls {
  BASE = 'https://www.linkedin.com',
  LOGIN = '/uas/login',
  JOBS_SEARCH = '/jobs/search',
  JOB_VIEW = '/jobs/view',
  FEED = '/feed',
  JOBS_RECOMMENDED = '/jobs/collections/recommended'
}

export const DEFAULT_AUTH_FILE = Path.resolve(PACKAGE_DIR, '../playwright/.auth/linkedin.json');
export const DEFAULT_CONNECTION_TIMEOUT = milliseconds({ seconds: 30 });

@injectable()
export class LinkedInExplorer {
  @inject(LinkedInDI.LinkedInExplorerConfig) private config!: LinkedInExplorerConfig;
  private readonly logPrefix = this.constructor.name;
  private page!: PlayWright.Page;
  private browser!: PlayWright.Browser;
  private browserContext!: PlayWright.BrowserContext;
  private searchJobsCommand!: LinkedInSearchJobsCommand;

  public async close() {
    await this.browser.close();
  }

  public async connect(): Promise<void> {
    NpmLog.info(this.logPrefix, `Launching browser...`);

    this.browser = await PlayWright.chromium.launch({
      headless: this.config.headless,
      slowMo: this.config.slowMo
    });

    const storageStateExists = FS.existsSync(DEFAULT_AUTH_FILE);

    this.browserContext = await this.browser.newContext({
      baseURL: LinkedInUrls.BASE,
      storageState: storageStateExists ? DEFAULT_AUTH_FILE : undefined
    });

    this.page = await this.browserContext.newPage();

    this.searchJobsCommand = new LinkedInSearchJobsCommand(this.page, this.browserContext);

    await this.page.goto(LinkedInUrls.FEED, {
      waitUntil: 'load'
    });

    NPMLog.info(this.logPrefix, 'Connected, checking for login required...');

    if (await this.isLoggedOut()) {
      await this.login();
    }
  }

  public async isLoggedOut(): Promise<boolean> {
    const signInCount = await this.page.getByText(/sign in/i).count();

    return signInCount > 0;
  }

  public async isLoggedIn(): Promise<boolean> {
    return !(await this.isLoggedOut());
  }

  public async login(): Promise<void> {
    NpmLog.info(this.logPrefix, `Logging in...`);

    await this.page.goto(LinkedInUrls.LOGIN);
    await this.page.fill('input[name="session_key"]', this.config.email);
    await this.page.fill('input[name="session_password"]', this.config.password);
    await this.page.click('button[type="submit"]');

    await this.browserContext.storageState({ path: DEFAULT_AUTH_FILE });

    await this.waitRandom();
  }

  public async searchJobs(params: LinkedInSearchJobsCommandParams, delegate: LinkedInSearchJobsCommandDelegate) {
    await this.searchJobsCommand.search(params, delegate);
  }

  private async waitRandom(min = 500, max = 2000) {
    await TimeUtil.waitRandom(min, max);
  }
}
