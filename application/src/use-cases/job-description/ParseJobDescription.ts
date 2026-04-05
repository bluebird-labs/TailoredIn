import type { JobDescriptionParseResult, JobDescriptionParser } from '../../ports/JobDescriptionParser.js';

export type ParseJobDescriptionInput = {
  text: string;
};

export class ParseJobDescription {
  public constructor(private readonly parser: JobDescriptionParser) {}

  public async execute(input: ParseJobDescriptionInput): Promise<JobDescriptionParseResult> {
    return this.parser.parseFromText(input.text);
  }
}
