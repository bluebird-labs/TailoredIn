export interface ResumeChestQuery {
  makeChestMarkdown(profileId: string): Promise<string>;
}
