import FS from 'node:fs';
import Path from 'node:path';
import { TimeUtil } from '@tailoredin/core';
import { Logger } from '@tailoredin/core/src/Logger.js';
import { milliseconds } from 'date-fns';
import * as PlayWright from 'playwright';
import {
  LinkedInSearchJobsCommand,
  type LinkedInSearchJobsCommandDelegate,
  type LinkedInSearchJobsCommandParams
} from './LinkedInSearchJobsCommand.js';
import { LinkedInUrls } from './LinkedInUrls.js';
import { PACKAGE_DIR } from './PACKAGE_DIR.js';

export { LinkedInUrls };

export type LinkedInExplorerConfig = {
  headless: boolean;
  slowMo: number;
  email: string;
  password: string;
};

export const DEFAULT_AUTH_FILE = Path.resolve(PACKAGE_DIR, 'playwright/.auth/linkedin.json');
export const DEFAULT_CONNECTION_TIMEOUT = milliseconds({ seconds: 30 });

export class LinkedInExplorer {
  private readonly log = Logger.create('LinkedInExplorer');
  private readonly config: LinkedInExplorerConfig;
  private page!: PlayWright.Page;
  private browser!: PlayWright.Browser;
  private browserContext!: PlayWright.BrowserContext;
  private searchJobsCommand!: LinkedInSearchJobsCommand;

  constructor(config: LinkedInExplorerConfig) {
    this.config = config;
  }

  public async close() {
    await this.browser.close();
  }

  public async connect(): Promise<void> {
    this.log.info('Launching browser...');

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

    this.log.info('Connected, checking for login required...');

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
    this.log.info('Logging in...');

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
