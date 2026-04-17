import { Inject, Injectable } from '@nestjs/common';
import { DI } from '../../DI.js';
import type { JobDescriptionParseResult, JobDescriptionParser } from '../../ports/JobDescriptionParser.js';

export type ParseJobDescriptionInput = {
  text: string;
};

@Injectable()
export class ParseJobDescription {
  public constructor(@Inject(DI.JobDescription.Parser) private readonly parser: JobDescriptionParser) {}

  public async execute(input: ParseJobDescriptionInput): Promise<JobDescriptionParseResult> {
    return this.parser.parseFromText(input.text);
  }
}
