import { Entity, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, UuidPrimaryKey } from '../../helpers.js';

type CompanyBriefProps = {
  id: string;
  companyId: string;
  productOverview: string;
  techStack: string;
  culture: string;
  recentNews: string;
  keyPeople: string;
  createdAt: Date;
  updatedAt: Date;
};

@Entity({ tableName: 'company_briefs' })
export class CompanyBrief extends BaseEntity {
  @UuidPrimaryKey({ fieldName: 'id' })
  public id: string;

  @Property({ fieldName: 'company_id', type: 'uuid' })
  public companyId: string;

  @Property({ fieldName: 'product_overview', type: 'text' })
  public productOverview: string;

  @Property({ fieldName: 'tech_stack', type: 'text' })
  public techStack: string;

  @Property({ fieldName: 'culture', type: 'text' })
  public culture: string;

  @Property({ fieldName: 'recent_news', type: 'text' })
  public recentNews: string;

  @Property({ fieldName: 'key_people', type: 'text' })
  public keyPeople: string;

  public constructor(props: CompanyBriefProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.companyId = props.companyId;
    this.productOverview = props.productOverview;
    this.techStack = props.techStack;
    this.culture = props.culture;
    this.recentNews = props.recentNews;
    this.keyPeople = props.keyPeople;
  }

  public static create(props: Omit<CompanyBriefProps, 'id' | 'createdAt' | 'updatedAt'>): CompanyBrief {
    const now = new Date();
    return new CompanyBrief({
      ...props,
      id: generateUuid(),
      createdAt: now,
      updatedAt: now
    });
  }
}
