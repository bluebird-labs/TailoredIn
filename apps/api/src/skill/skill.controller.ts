import { Controller, Get, Inject, Query } from '@nestjs/common';
import type { ListConcepts, ListSkillCategories, ListSkills, SearchSkills } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { SearchSkillsDto } from './dto/search-skills.dto.js';

@Controller()
export class SkillController {
  public constructor(
    @Inject(DI.Skill.Search) private readonly searchSkills: SearchSkills,
    @Inject(DI.Skill.List) private readonly listSkills: ListSkills,
    @Inject(DI.Skill.ListCategories) private readonly listCategories: ListSkillCategories,
    @Inject(DI.Skill.ListConcepts) private readonly listConcepts: ListConcepts
  ) {}

  @Get('skills')
  public async search(@Query() query: SearchSkillsDto) {
    const data = await this.searchSkills.execute({ query: query.q, limit: query.limit });
    return { data };
  }

  @Get('skills/all')
  public async listAll() {
    const data = await this.listSkills.execute();
    return { data };
  }

  @Get('skill-categories')
  public async categories() {
    const data = await this.listCategories.execute();
    return { data };
  }

  @Get('concepts')
  public async concepts() {
    const data = await this.listConcepts.execute();
    return { data };
  }
}
